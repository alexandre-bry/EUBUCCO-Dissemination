class Header extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // Detect current page to highlight active link
        const currentPath = window.location.pathname;
        const isMapActive =
            currentPath.includes("index.html") || currentPath.endsWith("/");
        const isDownloadActive = currentPath.includes("data.html");
        const isAboutActive = currentPath.includes("about.html");

        this.innerHTML = `
      <style>
        header {
          background-color: #111418; 
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 40px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          border-bottom: 1px solid #38393a;
        }

        .logo {
          color: #4c82f7;
          text-decoration: none;
          font-weight: 800;
          font-size: 1.1rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        nav {
          display: flex;
          gap: 30px;
          background-color: #111418;
        }

        .header-nav-link {
          color: #ffffff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.95rem;
          padding-bottom: 8px;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
        }

        /* Hover effect */
        .header-nav-link:hover {
          color: #4c82f7;
        }

        /* Active state */
        .header-nav-link.active {
          color: #4c82f7;
          border-bottom: 3px solid #4c82f7;
        }
      </style>

      <header>
        <a href="index.html" class="logo">EUBUCCO DISSEMINATION</a>
        <nav>
            <a href="index.html" class="header-nav-link ${isMapActive ? "active" : ""}">Map</a>
            <a href="data.html" class="header-nav-link ${isDownloadActive ? "active" : ""}">Download</a>
            <a href="about.html" class="header-nav-link ${isAboutActive ? "active" : ""}">About</a>
        </nav>
      </header>
    `;
    }
}

customElements.define("header-component", Header);
