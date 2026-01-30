#import "../template/template-long.typ": (
  appendix-container, cover-container, init, main-content-container, post-content-container, pre-content-container,
)
#import "../template/cover.typ"

#import "../other-tools/custom-style.typ"

/* -------------------------------------------------------------------------- */
/*                 Define some parameters used multiple times                 */
/* -------------------------------------------------------------------------- */

/* ---------------------------- Document settings --------------------------- */
#let title = "Dissemination of EUBUCCO"
#let subtitle = "GEO5019: Final Engineering Report"
#let authors-names = ("Alexandre Bry", "Carlo Cordes", "Phuong Anh Ho (Alena)")
#let authors-data = ("Student number": ("6277535", "6315895", "6295488"))

/* -------------------------------------------------------------------------- */
/*                           Actual document content                          */
/* -------------------------------------------------------------------------- */


#show: init.with(
  title: title,
  subtitle: subtitle,
  authors-names: authors-names,
  authors-data: authors-data,
  text-font: "Source Serif Pro",
  raw-font: "Source Code Pro",
)

#show: custom-style.custom-style

/* ------------------------------- Cover page ------------------------------- */

#[
  #show: cover-container.with(full-page: true)
  #cover.cover(
    title: text(size: 30pt)[#title],
    subtitle: text(size: 20pt)[#subtitle],
    authors-names: authors-names,
    authors-data: authors-data,
    full-page: true,
    date: datetime.today(),
  )
]

/* ------------------------------ Main content ------------------------------ */

#[
  #show: main-content-container.with(
    h1-new-page: false,
  )
  #include "content.typ"
]
