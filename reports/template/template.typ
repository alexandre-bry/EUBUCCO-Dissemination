#import "utils.typ": (
  _combine-supplement-numbering, _process-heading-attributes, format-authors-data, grid-align-left-center-right,
)

#import "@preview/numbly:0.1.0"

/// Main function of the template that defines the overall style.
/// This function is designed to be used in the main scope of the document,
/// and to be called using `#show: init.with(...)`.
///
/// -> content
#let init(
  /// The body of the document.
  ///
  /// -> content
  body,
  /// The title of the document.
  ///
  /// -> str | content
  title: "",
  /// The subtitle of the document.
  ///
  /// -> str | content
  subtitle: "",
  /// The names of the authors.
  ///
  /// -> array | str | content
  authors-names: (),
  /// The data of the authors. Can contain any number for (key, value) pairs.
  /// The key is a string and the value is an array of strings.
  /// The key is used as a label for the piece of information and the values correspond to the authors.
  ///
  /// -> dictionary
  authors-data: (:),
  /// The font to use for the text.
  ///
  /// -> str | array
  text-font: ("Source Serif 4", "Libertinus Serif"),
  /// The font to use for the math.
  ///
  /// -> str | array
  math-font: ("STIX Two Math", "New Computer Modern Math"),
  /// The font to use for the raw text.
  ///
  /// -> str | array
  raw-font: ("Source Code Pro", "Libertinus Mono"),
  /// The font to use for the text in titles.
  /// If none, the text font will be used.
  ///
  /// -> str | array | none
  headings-font: none,
  /// The font size multiplier to use for the text.
  /// This is used to scale the font size of the document.
  ///
  /// -> float
  font-size-multiplier: 1.0,
  /// The base font size to use for the text.
  ///
  /// -> length
  base-font-size: 11pt,
  /// The content of the header.
  ///
  /// -> length
  header: (left: "[title]", center: none, right: "[subtitle]"),
  /// The default page numbering style to use.
  ///
  /// -> str | function
  page-numbering: "1",
  /// Special argument for the documentation.
  ///
  /// -> bool
  _documentation: false,
) = {
  // Format the input arguments
  headings-font = if headings-font == none { text-font } else { headings-font }
  let formatted-authors = format-authors-data(
    authors-data: authors-data,
    authors-names: authors-names,
  )
  authors-names = formatted-authors.authors-names
  authors-data = formatted-authors.authors-data

  // Document basic properties
  let authors-names-str = authors-names.map(t => if type(t) == content {
    t.text
  } else if type(t) == str {
    t
  } else {
    panic("authors-names must be an array of strings or content")
  })
  set document(author: authors-names-str, title: title, description: subtitle) if not _documentation

  // Make paragraphs justified
  set par(justify: true)

  // Set basic text properties
  set text(
    font: text-font,
    size: base-font-size * font-size-multiplier,
    lang: "en",
    region: "GB",
  )
  show raw: set text(
    font: raw-font,
    size: (base-font-size - 2pt) * font-size-multiplier,
    weight: 400,
  )

  // Header with title and authors
  let header-possible-keys = ("left", "center", "right")
  for key in header.keys() {
    if key not in header-possible-keys {
      panic("The only available keys for the header are " + header-possible-keys.join(", ", last: " and ") + ".")
    }
  }
  let replacements = (
    "[title]": title,
    "[subtitle]": subtitle,
    "[authors]": authors-names-str.join(", "),
  )
  for key in header-possible-keys {
    if header.at(key) == none { continue }
    for (old, new) in replacements {
      header.at(key) = header.at(key).replace(old, if new != none { new } else { "" })
    }
  }
  set page(
    header: [
      #set text((base-font-size - 3pt) * font-size-multiplier)
      #grid-align-left-center-right(header)
    ],
    numbering: page-numbering,
  ) if not _documentation

  // Page footer
  set page(
    footer: context [
      #set align(center)
      #set text(10pt)
      #numbering(page.numbering, ..counter(page).get())
    ],
  )

  // Lists
  set list(indent: 1em)
  set enum(indent: 1em)

  // Math
  show math.equation: set text(font: math-font)
  // Reset math counter at each chapter
  show heading.where(level: 1): it => {
    counter(math.equation).update(0)
    it
  }
  set math.equation(numbering: n => {
    let h1 = counter(heading).get().first()
    numbering("(1.1)", h1, n)
  })

  // To be able to cite elements without numbering (for the annex for example)
  show ref: it => context {
    if it.element == none { return it }
    if it.element.func() == heading {
      // Handle references to headings
      set text(style: "italic")
      // show: it => underline(it, stroke: 0.5pt, offset: 1pt)
      if it.element.numbering == none {
        // Use the supplement when there is no numbering
        link(it.target, it.element.supplement)
      } else if type(it.element.numbering) == function {
        // Remove the trailing punctuation from the numbering
        let count = counter(heading).at(it.element.location())
        let next-count = count.map(it => it + 1)
        let num = numbering(it.element.numbering, ..count)
        let next-num = numbering(it.element.numbering, ..next-count)
        while (num.last() == next-num.last()) {
          num = num.slice(0, -1)
          next-num = next-num.slice(0, -1)
        }
        let supp_and_num = _combine-supplement-numbering(
          supplement: it.element.supplement,
          numbering-value: num,
        )
        supp_and_num
      } else {
        it
      }
    } else if it.element.func() == figure {
      // Handle references to figures
      let current-heading = query(selector(heading).before(here())).last()
      let heading-of-ref = query(selector(heading).before(it.element.location())).last()
      // Normal reference if the reference is in the same heading
      if current-heading == heading-of-ref { return it }
      // Otherwise, add the heading of the reference
      // Make sure to remove the trailing punctuation from the numbering
      let count = counter(heading).at(heading-of-ref.location())
      let next-count = count.map(it => it + 1)
      let num = numbering(heading-of-ref.numbering, ..count)
      let next-num = numbering(heading-of-ref.numbering, ..next-count)
      while (num.last() == next-num.last()) {
        num = num.slice(0, -1)
        next-num = next-num.slice(0, -1)
      }
      let supp_and_num = _combine-supplement-numbering(
        supplement: heading-of-ref.supplement,
        numbering-value: num,
      )
      link(it.target, [#it (#text(style: "italic")[#supp_and_num])])
    } else {
      it
    }
  }

  // Style url links
  show link: it => {
    if type(it.dest) == str { text(fill: rgb("#3087b3"), it) } else { it }
  }

  // Headings style
  show heading.where(level: 1): set align(center)
  show heading.where(level: 1): set block(below: 1em)
  let headings-font-properties = (
    ((base-font-size + 7pt) * font-size-multiplier, "bold", "normal"),
    ((base-font-size + 5pt) * font-size-multiplier, "bold", "normal"),
    ((base-font-size + 3pt) * font-size-multiplier, "bold", "normal"),
    ((base-font-size + 1pt) * font-size-multiplier, "bold", "normal"),
    (base-font-size * font-size-multiplier, "semibold", "italic"),
    (base-font-size * font-size-multiplier, "regular", "italic"),
  )
  show: body => {
    {
      for level in range(1, 7) {
        let properties = headings-font-properties.at(level - 1)
        body = {
          show heading.where(level: level): set text(
            size: properties.at(0),
            weight: properties.at(1),
            style: properties.at(2),
            font: headings-font,
          )
          body
        }
      }
    }
    body
  }

  // Outline style
  set outline(indent: 2em, depth: 3)
  show outline.entry: it => {
    set text(weight: "bold") if it.level == 1
    set block(above: 1em) if it.level == 1
    set block(above: 0.5em) if it.level != 1
    show repeat: rep => {
      if it.level == 1 { none } else { rep }
    }
    it
  }

  // Set supplements for headings for references
  show outline: set heading(supplement: it => it.body)

  body
}

/// Cover page container.
/// To use in combination with a cover page.
/// Removes the header and footer of the page.
///
/// ```example
/// >>> #show: it => { block(width: 16cm, height: 18cm)[#it] }
/// >>> #show: init.with(_documentation: true)
/// #[
///   #show: cover-container.with(_documentation: true)
///   #cover.cover(
///     title: "Title of the Document",
///     subtitle: "Subtitle",
///     authors-names: ("Lorem Ipsum", "Dolor Sit", "Amet Consectetur"),
///     authors-data: (
///       "Student IDs": ("1234567", "9876543", "7654321"),
///       "Email": (
///         "lorem.ipsum@email.com",
///         "dolor.sit@email.com",
///         "amet.consectetur@email.com",
///       ),
///     ),
///     date: datetime.today(),
///     _documentation: true,
///   )
/// ]
/// ```
///
/// -> content
#let cover-container(
  /// The body of the document.
  ///
  /// -> content
  body,
  /// Whether the cover page is a full page or not.
  /// If true, the page will be set to have no header or footer.
  ///
  /// -> bool
  full-page: true,
  /// Special argument for the documentation.
  ///
  /// -> bool
  _documentation: false,
) = {
  // Set page properties if full page
  set page(
    numbering: none,
    header: none,
    footer: none,
  ) if (not _documentation) and full-page

  body
}

/// Generic container for a subset of the document.
/// This function is designed to define the style of the document locally,
/// using a `show` rule like this:
///
/// ```typst
/// #[
///   #show: generic-container.with(
///     new-page: true,
///     page-numbering: "1"
///   )
///   #include "../content/content.typ"
/// ]
/// ```
///
/// -> content
#let generic-container(
  /// The body of the document.
  ///
  /// -> content
  body,
  /// Whether to start a new page at the beginning of the container.
  ///
  /// -> bool
  new-page: true,
  /// Whether to start a new page before each level 1 heading.
  ///
  /// -> bool
  h1-new-page: true,
  /// Whether to reset the page numbering at the beginning of the container.
  ///
  /// -> bool
  reset-page-numbering: true,
  /// The page numbering style to use.
  ///
  /// -> none | str | function
  page-numbering: none,
  /// The heading numbering style to use.
  /// If it is an array, it must have 6 elements (one for each heading level).
  /// Each element of the array must be one of the other allowed types.
  ///
  /// -> none | str | function | array
  heading-numbering: none,
  /// The supplement to use for the headings.
  /// If it is an array, it must have 6 elements (one for each heading level).
  /// Each element of the array must be one of the other allowed types.
  ///
  /// -> none | str | content | array
  heading-supplement: "Section",
) = {
  // Page breaks before level 1 headings
  show heading.where(level: 1): it => {
    if h1-new-page { pagebreak(weak: true) }
    it
  }

  // Handle numbering
  let numberings = _process-heading-attributes(
    attributes: heading-numbering,
    attribute-name: "heading-numbering",
    possible-types: (none, str, function),
  )
  let supplements = _process-heading-attributes(
    attributes: heading-supplement,
    attribute-name: "heading-supplement",
    possible-types: (none, str, content),
  )
  show: body => {
    for level in range(1, 7) {
      body = {
        let nring = numberings.at(level - 1)
        let new-supplement = supplements.at(level - 1)
        show heading.where(level: level): set heading(numbering: nring)
        show heading.where(level: level): set heading(supplement: it => if nring == none { it.body } else {
          new-supplement
        })
        body
      }
    }

    body
  }

  // New page before the content
  if new-page {
    pagebreak(weak: true)
  }
  // Reset page numbering
  if reset-page-numbering {
    if not new-page {
      panic(
        "Resetting the page numbering requires that the section starts with a new page (i.e. `reset-page-numbering` == true requires `new-page` == true)",
      )
    }
    counter(page).update(1)
  }
  set page(numbering: page-numbering) if reset-page-numbering

  body
}

/// Container for the pre-content of the document.
/// Pre-content is defined as the content after the cover page and before the main content (usually containing the preface, acknowledgements, abstract, table of contents, etc.).
/// This function is designed to define the style of the document locally, using a `show` rule, like in #ref(label("-generic-container()")).
///
/// -> content
#let pre-content-container(
  /// @generic-container
  body,
  /// @generic-container
  new-page: true,
  /// @generic-container
  h1-new-page: true,
  /// @generic-container
  reset-page-numbering: true,
  /// @generic-container
  page-numbering: "i",
  /// @generic-container
  heading-numbering: none,
  /// @generic-container
  heading-supplement: "Section",
) = {
  // Common sub-container
  show: generic-container.with(
    new-page: new-page,
    h1-new-page: h1-new-page,
    reset-page-numbering: reset-page-numbering,
    page-numbering: page-numbering,
    heading-numbering: heading-numbering,
    heading-supplement: heading-supplement,
  )

  body
}

/// Container for the main content of the document.
/// Main content is defined as the core content, usually containing the chapters, sections, and subsections.
/// This function is designed to define the style of the document locally, using a `show` rule, like in #ref(label("-generic-container()")).
///
/// -> content
#let main-content-container(
  /// @generic-container
  body,
  /// @generic-container
  new-page: true,
  /// @generic-container
  h1-new-page: true,
  /// @generic-container
  reset-page-numbering: true,
  /// @generic-container
  page-numbering: "1",
  /// @generic-container
  heading-numbering: ("1.", "1.a.", "1.a.i.", none, none, none),
  /// @generic-container
  heading-supplement: ("Chapter", "Section", "Subsection", none, none, none),
) = {
  // Common sub-container
  show: generic-container.with(
    new-page: new-page,
    h1-new-page: h1-new-page,
    reset-page-numbering: reset-page-numbering,
    page-numbering: page-numbering,
    heading-numbering: heading-numbering,
    heading-supplement: heading-supplement,
  )

  body
}

/// Container for the post-content of the document.
/// Post-content is defined as the content after the main content and before the appendix (usually containing the bibliography, index, etc.).
/// This function is designed to define the style of the document locally, using a `show` rule, like in #ref(label("-generic-container()")).
///
/// -> content
#let post-content-container(
  /// @generic-container
  body,
  /// @generic-container
  new-page: true,
  /// @generic-container
  h1-new-page: true,
  /// @generic-container
  reset-page-numbering: false,
  /// @generic-container
  page-numbering: "1",
  /// @generic-container
  heading-numbering: none,
  /// @generic-container
  heading-supplement: "Section",
) = {
  // Common sub-container
  show: generic-container.with(
    new-page: new-page,
    h1-new-page: h1-new-page,
    reset-page-numbering: reset-page-numbering,
    page-numbering: page-numbering,
    heading-numbering: heading-numbering,
    heading-supplement: heading-supplement,
  )

  body
}

/// Container for the appendix of the document.
/// Appendix is defined as a separate part at the end of the document that gives extra information.
/// This function is designed to define the style of the document locally, using a `show` rule, like in #ref(label("-generic-container()")).
///
/// -> content
#let appendix-container(
  /// @generic-container
  body,
  /// @generic-container
  new-page: true,
  /// @generic-container
  h1-new-page: true,
  /// @generic-container
  reset-page-numbering: true,
  /// @generic-container
  page-numbering: numbly.numbly("A-{1:1}"),
  /// @generic-container
  heading-numbering: numbly.numbly("Appendix {1:A}", "{1:A}.{2:1}.", "{1:A}.{2:1}.{3:a}.", none, none, none),
  /// @generic-container
  heading-supplement: (none, "Appendix", "Appendix", none, none, none),
) = {
  // Special style for h1 headings
  show heading.where(level: 1): it => align(center)[
    #let num = if it.numbering == none { none } else { numbering(it.numbering, ..counter(heading).at(it.location())) }
    #block(below: 0.7em)[#num]
    #block(above: 0em, below: 1em)[#it.body]
  ]

  // Common sub-container
  show: generic-container.with(
    new-page: new-page,
    h1-new-page: h1-new-page,
    reset-page-numbering: reset-page-numbering,
    page-numbering: page-numbering,
    heading-numbering: heading-numbering,
    heading-supplement: heading-supplement,
  )

  // Reset heading numbering
  counter(heading).update(0)

  body
}
