"""Mur creme a la chaux, genere par code (numpy), raccordable par construction.
Usage : python mur_procedural.py <sortie.webp> [graine]
Principe : champ de hauteur = somme de bruits periodiques (convolution FFT, donc
circulaire = carreau sans couture) + passes de truelle (flous anisotropes orientes),
puis eclairage par normales (Lambert + ambiant) sur un albedo creme legerement varie.
"""
import sys
import numpy as np
from PIL import Image

W, H = 2048, 1024
rng = np.random.default_rng(int(sys.argv[2]) if len(sys.argv) > 2 else 7)


def periodic_blur(x, sx, sy=None, angle=0.0):
    """Flou gaussien periodique (FFT), eventuellement anisotrope et oriente."""
    sy = sx if sy is None else sy
    fy = np.fft.fftfreq(H)[:, None]
    fx = np.fft.fftfreq(W)[None, :]
    c, s = np.cos(angle), np.sin(angle)
    u = fx * c + fy * s
    v = -fx * s + fy * c
    kernel = np.exp(-2 * (np.pi ** 2) * ((sx * u) ** 2 + (sy * v) ** 2))
    return np.real(np.fft.ifft2(np.fft.fft2(x) * kernel))


def noise(sigma, sy=None, angle=0.0):
    n = periodic_blur(rng.standard_normal((H, W)), sigma, sy, angle)
    return n / (n.std() + 1e-9)


# 1. Relief de l'enduit : grain fin -> ondulations larges
height = (
    0.035 * noise(1.2)      # grain de la chaux
    + 0.07 * noise(3.5)    # micro-relief
    + 0.16 * noise(10)     # bosses de l'enduit
    + 0.45 * noise(28)     # ondulations
    + 0.65 * noise(80)     # grandes vagues de la taloche
)
# 2. Passes de truelle : flous allonges dans 4 directions, pondérés par un masque large
for ang in (0.35, 1.9, -0.8, 2.6):
    stroke = noise(90, 7, ang)                     # trainee longue et fine
    mask = (noise(120) > 0.3).astype(float)        # ou la passe est visible
    mask = periodic_blur(mask, 25)
    height += 0.20 * stroke * mask
# 3. Petits accidents : piqures et eclats
pits = periodic_blur((rng.random((H, W)) > 0.99996).astype(float), 1.6)
height -= 25 * pits
height = (height - height.mean()) / height.std()

# 4. Normales et eclairage (lumiere douce haut-gauche, comme le studio)
scale = 1.5
gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * scale
gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * scale
nz = 1.0 / np.sqrt(gx ** 2 + gy ** 2 + 1)
nx, ny = -gx * nz, -gy * nz
light = np.array([-0.45, -0.60, 1.0]); light /= np.linalg.norm(light)
lambert = np.clip(nx * light[0] + ny * light[1] + nz * light[2], 0, 1)
shade = 0.74 + 0.26 * lambert                       # ambiant + diffus, contraste doux

# 5. Albedo creme : teinte de base + derive lente + grain colore discret
base = np.array([0.925, 0.895, 0.840])              # ~#E7E0D3
tint = noise(160) * 0.012
grain = noise(1.0) * 0.010
rgb = np.empty((H, W, 3))
for i in range(3):
    rgb[..., i] = base[i] + tint * (1.0 if i < 2 else 0.6) + grain
# ombres dans les creux (occlusion simplifiee) : plus sombre la ou le relief est bas
ao = 1 - 0.045 * np.clip(-periodic_blur(height, 6), 0, 2)
rgb *= (shade * ao)[..., None]

img = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype("uint8"))
img.save(sys.argv[1], "WEBP", quality=92)
print("ecrit", sys.argv[1], img.size)
