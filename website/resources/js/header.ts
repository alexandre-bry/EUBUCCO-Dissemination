class Header extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
      <header>
        <nav>
            <a href="index.html" class="header-nav-link">Map</a>
            <a href="data.html" class="header-nav-link">Download</a>
        </nav>
      </header>
    `;
    }
}

customElements.define("header-component", Header);
