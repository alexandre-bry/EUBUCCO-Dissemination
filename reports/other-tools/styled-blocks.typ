/// Create a styled block with a title and content.
///
/// ```example
/// #styled-block()[Here is the title][Here is the content that is longer.]
/// ```
///
/// -> content
#let styled-block(
  /// The title of the block.
  /// -> str | content | none
  title,
  /// The content of the block.
  /// -> str | content | none
  content,
  /// The type of the block (e.g., "TODO", "Discussion"), displayed below the title.
  /// -> str | content | none
  block-type: none,
  /// The colour of the title background.
  /// -> color
  fill-title: rgb(180, 180, 255),
  /// The colour of the content background.
  /// -> color
  fill-content: rgb(210, 210, 255),
  /// The inset of the title and content blocks.
  /// -> length | dictionary
  inset: (x: 6pt, y: 8pt),
  /// The radius of the title and content blocks.
  /// -> length
  radius: 8pt,
  /// Whether to render the block.
  /// -> bool
  render: true,
) = {
  if not render {
    return []
  }
  context layout(page-size => {
    // Create the actual content
    let title-prefix = if block-type == none {
      none
    } else {
      [#block-type: ]
    }
    let title-content = [#strong[#title-prefix]#strong[#title]]
    let content-content = [#content]

    // Create the blocks
    let title-block
    let content-block
    if content in (none, "", []) {
      title-block = block(
        title-content,
        fill: fill-title,
        inset: inset,
        radius: radius,
        sticky: true,
      )
      content-block = none
    } else {
      // Compute the widths
      let x-inset = if type(inset) == dictionary {
        inset.x
      } else {
        inset
      }
      let content-block-width = calc.min(page-size.width, measure(content-content).width + x-inset * 2)
      let title-block-width = calc.min(page-size.width, measure(title-content).width + x-inset * 2)

      // Set the radius of the two blocks based on the widths
      let title-radius
      let content-radius
      if title-block-width < content-block-width {
        title-radius = (top: radius)
        content-radius = (bottom: radius, top-right: calc.min(radius, content-block-width - title-block-width))
      } else {
        title-radius = (top: radius, bottom-right: calc.min(radius, title-block-width - content-block-width))
        content-radius = (bottom: radius)
      }
      // Create the two blocks
      title-block = block(
        title-content,
        fill: fill-title,
        inset: inset,
        radius: title-radius,
        below: 0em,
        sticky: true,
      )
      content-block = block(
        content-content,
        fill: fill-content,
        inset: inset,
        width: content-block-width,
        radius: content-radius,
      )
    }
    // Return the blocks
    [#title-block#content-block]
  })
}

/// Create a styled block for TODOs.
///
/// ```example
/// #block-todo()[We have something to do][Don't forget to do it!]
/// ```
///
/// -> content
#let block-todo(
  /// The title of the block.
  /// -> str | content | none
  title,
  /// The content of the block.
  /// -> str | content | none
  content,
  /// Whether to render the block.
  /// -> bool
  render: true,
) = styled-block(
  block-type: "TODO",
  fill-title: rgb(255, 180, 180),
  fill-content: rgb(255, 210, 210),
  render: render,
  title,
  content,
)

/// Create a styled block for discussions.
///
/// ```example
/// #block-discussion()[Add more explanations?][- Author A: Maybe it would be better...
/// - Author B: Yes, but I don't know...
/// - Author A: What about...]
/// ```
///
/// -> content
#let block-discussion(
  /// The title of the block.
  /// -> str | content | none
  title,
  /// The content of the block.
  /// -> str | content | none
  content,
  /// Whether to render the block.
  /// -> bool
  render: true,
) = styled-block(
  block-type: "Discussion",
  fill-title: rgb(180, 255, 180),
  fill-content: rgb(210, 255, 210),
  render: render,
  title,
  content,
)
