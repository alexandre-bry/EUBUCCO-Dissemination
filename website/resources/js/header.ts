class Header extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
      <header>
        <nav>
            <a href="index.html" class="header-nav-link">Home</a>
            <a href="data.html" class="header-nav-link">Data</a>
            <a href="map.html" class="header-nav-link">Map</a>
            <a href="about.html" class="header-nav-link">About</a>
        </nav>
      </header>
    `;
    }
}

customElements.define("header-component", Header);
