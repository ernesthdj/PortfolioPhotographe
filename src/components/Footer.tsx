export function Footer() {
  return (
    <footer
      id="contact"
      className="flex flex-col items-center gap-2.5 border-t border-ink/10 px-6 py-9 text-xs text-ink/60"
    >
      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
        <span>© 2026 Ernest H. Photography</span>
        <div className="flex gap-5">
          <a href="https://instagram.com/h.ernest_photography" target="_blank" rel="noreferrer">
            Instagram
          </a>
          <a href="/mentions-legales">Mentions légales</a>
          <a href="mailto:ernest_photography@outlook.com">Contact</a>
        </div>
      </div>
    </footer>
  );
}
