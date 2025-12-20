#import "cover-utils.typ": authors-centered, authors-grid, background-box
#import "utils.typ": format-authors-data

#let cover-group(
  contents: (),
  spaces: (1fr,),
  dir: "v",
  individual-alignments: (),
  general-alignment: center,
  stroke: none,
  perpendicular-space: 1fr,
) = {
  // Check the correctness of the content and spaces arguments
  if type(contents) != array {
    panic("The contents argument of cover-group should be an array.")
  }
  if type(spaces) != array {
    panic("The spaces argument of cover-group should be an array.")
  }
  if type(individual-alignments) != array {
    panic("The individual-alignments argument of cover-group should be an array.")
  }
  if spaces.len() != contents.len() + 1 {
    panic("The spaces argument of cover-group should have exactly one more element than contents.")
  }
  if contents.len() != individual-alignments.len() {
    panic("The contents argument of cover-group should have exactly the same size as individual-alignments.")
  }

  // Select the correct direction for the group
  let space-func
  let stack-dir
  if dir == "v" {
    space-func = space => v(space, weak: true)
    stack-dir = direction.ttb
  } else if dir == "h" {
    space-func = space => h(space, weak: true)
    stack-dir = direction.ltr
  } else {
    panic("The dir argument of cover-group should either be \"v\" or \"h\".")
  }

  // let full-content = (space-func(spaces.at(0)),)
  let formatted-contents = ()
  for i in range(contents.len()) {
    formatted-contents.push(align(individual-alignments.at(i), contents.at(i)))
  }
  let grid-params = if dir == "h" {
    (
      columns: (0em,) + (auto,) * formatted-contents.len() + (0em,),
      column-gutter: spaces,
    )
  } else {
    (columns: perpendicular-space, row-gutter: spaces)
  }
  let alignments = (left,) + individual-alignments + (left,)
  align(general-alignment, grid(align: alignments, ..grid-params, [], ..formatted-contents, [], stroke: stroke))
}


#let cover-text-block(
  content,
  alignment: none,
  background-color: none,
  background-left-space: 1em,
  background-right-space: 1em,
  background-top-space: 1em,
  background-bottom-space: 1em,
) = {
  let final-content = content

  // Apply the alignment modification
  if alignment != none { final-content = align(alignment, final-content) }

  // Apply the background modifications
  final-content = background-box(
    final-content,
    background-color,
    top-space: background-top-space,
    bottom-space: background-bottom-space,
    left-space: background-left-space,
    right-space: background-right-space,
  )

  final-content
}

#let cover-image-block(
  content,
  background-color: none,
  background-top-space: 0em,
  background-bottom-space: 0em,
) = {
  let final-content = content

  // Apply the background modifications
  final-content = background-box(
    final-content,
    background-color,
    top-space: background-top-space,
    bottom-space: background-bottom-space,
  )

  final-content
}



/// Cover page template.
/// Supports full page and non-full page formats.
///
/// ```example
/// >>> #show: it => { block(width: 16cm, height: 23cm)[#it] }
/// >>> #show: template.init.with(_documentation: true)
/// #[
///   #show: template.cover-container.with(_documentation: true)
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
///     full-page: true,
///     date: datetime.today(),
///     _documentation: true,
///   )
/// ]
/// ```
///
/// -> content
#let cover(
  /// The title of the document.
  ///
  /// -> str | content
  title: "",
  /// The subtitle of the document.
  ///
  /// -> str | content | none
  subtitle: none,
  /// The names of the authors.
  ///
  /// -> str | array
  authors-names: (),
  /// The data of the authors. Can contain any number for (key, value) pairs.
  /// The key is a string and the value is an array of strings.
  /// The key is used as a label for the piece of information and the values correspond to the authors.
  ///
  /// -> dictionary
  authors-data: (:),
  /// The maximum number of columns to display the authors
  ///
  /// -> int
  authors-max-columns: 2,
  /// The date to be displayed on the cover page.
  /// If not provided, the current date is used.
  ///
  /// -> datetime | str | content | none
  date: datetime.today(),
  /// Whether to use the full page format or not.
  /// This only changes the vertical layout of the content.
  ///
  /// -> bool
  full-page: true,
  /// Font sizes to use for the different elements (title, subtitle, authors, date)
  ///
  /// -> array | none
  logos: none,
  /// Free content added after the date
  ///
  /// -> content | none
  other-content: none,
  /// Special argument for the documentation.
  ///
  /// -> bool
  _documentation: false,
) = {
  set page(margin: 2em) if full-page and not _documentation

  let all-contents = (:)
  let all-spaces = (start: if full-page { 5em } else { 0em })

  // Title and subtitle
  let title-content = text(size: 30pt, title, weight: 700)
  let subtitle-content = text(size: 22pt, subtitle, weight: 500)
  all-contents.title = title-content
  all-spaces.title = if full-page { 3em } else { 1em }
  all-contents.subtitle = subtitle-content
  all-spaces.subtitle = if full-page { 5em } else { 3em }

  // Authors
  // Format properly
  let formatted-authors = format-authors-data(
    authors-data: authors-data,
    authors-names: authors-names,
  )
  authors-names = formatted-authors.authors-names
  authors-data = formatted-authors.authors-data
  let authors-content = text(
    authors-centered(
      authors-data: authors-data,
      authors-names: authors-names,
      max-columns: authors-max-columns,
      row-gutter: 2em,
    ),
    size: 14pt,
  )
  if full-page {
    all-contents.by = [#text([by], size: 13pt)]
    all-spaces.by = 5em
  }
  all-contents.authors = authors-content
  all-spaces.authors = if full-page { 3fr } else { 2em }

  // Date
  if date != none {
    let date-formatted = if type(date) in (str, content) {
      date
    } else if type(date) == datetime {
      let date-format = "[day padding:none] [month repr:long] [year]"
      date.display(date-format)
    } else {
      panic("Invalid date type. Use str, content or datetime.")
    }
    let date-content = text(
      date-formatted,
      size: 14pt,
      style: "italic",
    )
    all-contents.date = date-content
    all-spaces.date = if full-page { 2fr } else { 2em }
  }

  // Other content at the end
  if other-content != none {
    all-contents.other = other-content
    all-spaces.other = if full-page { 3em } else { 1em }
  }

  // Logos
  if logos != none {
    if type(logos) != array { logos = (logos,) }
    let logos-spaces = (1fr,) + (3fr,) * (logos.len() - 1) + (1fr,)
    let logos-alignments = (center + bottom,) * logos.len()
    let logos-content = cover-image-block(
      cover-group(
        contents: logos,
        spaces: logos-spaces,
        dir: "h",
        individual-alignments: logos-alignments,
      ),
    )
    all-contents.logos = logos-content
    all-spaces.logos = 5em
  }

  let order = if full-page {
    ("title", "subtitle", "by", "authors", "date", "other", "logos")
  } else {
    ("title", "subtitle", "date", "authors", "other", "logos")
  }

  // Stack everything vertically
  let order-contents = ()
  let order-spaces = (all-spaces.start,)
  for key in order {
    if key in all-contents.keys() {
      order-contents.push(all-contents.at(key))
      order-spaces.push(all-spaces.at(key))
    }
  }
  let order-alignments = (center,) * order-contents.len()
  cover-group(
    contents: order-contents,
    spaces: order-spaces,
    dir: "v",
    individual-alignments: order-alignments,
  )
}

