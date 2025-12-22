class Footer extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
      <footer>
        <div class="nav-footer">
            <a href="https://github.com/alexandre-bry/EUBUCCO-Dissemination" class="footer-nav-link">GitHub</a>
            <a href="about.html" class="footer-nav-link">About</a>
        </div>
      </footer>
    `;
    }
}

customElements.define("footer-component", Footer);
