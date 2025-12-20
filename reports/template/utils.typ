/// Combine the supplement and numbering of a heading into a single element.
///
/// -> str | content | none
#let _combine-supplement-numbering(
  /// The supplement to be added to the numbering.
  ///
  /// -> str | content | none
  supplement: none,
  /// The numbering of the heading.
  ///
  /// -> str | content | none
  numbering-value: none,
) = {
  if supplement == none or supplement == [] {
    return numbering-value
  }
  if numbering-value == none {
    return supplement
  }
  return supplement + " " + numbering-value
}

/// Process the attributes to style all heading levels to get an array of 6 attributes.
///
/// -> array
#let _process-heading-attributes(
  /// The attributes to be applied to the heading levels.
  /// The possible types are the ones specified in the `possible-types` argument.
  ///
  /// -> any
  attributes: none,
  /// The name of the attribute to be used in the error message.
  ///
  /// -> str
  attribute-name: "",
  /// The possible types of the attributes.
  ///
  /// -> array
  possible-types: (none, str, function),
) = {
  let panic-msg = (
    attribute-name
      + " must be "
      + possible-types.map(t => if t == none { "none" } else { "a " + str(t) }).join(", ")
      + " or an array containing 6 of them"
  )
  let real-attributes = if attributes == none {
    (none,) * 6
  } else if type(attributes) in (str, function) {
    (attributes,) * 6
  } else if type(attributes) == array {
    if attributes.len() != 6 {
      panic(panic-msg)
    } else if not attributes.all(it => type(it) in (str, function) or it == none) {
      panic(panic-msg)
    } else {
      attributes
    }
  }
  real-attributes
}

#let format-authors-data(
  authors-data: (:),
  authors-names: (),
) = {
  if type(authors-names) != array {
    authors-names = (authors-names,)
  }
  if authors-data in (none, ()) {
    authors-data = (:)
  }
  for key in authors-data.keys() {
    if type(authors-data.at(key)) != array {
      authors-data.at(key) = (authors-data.at(key),)
    }
  }
  return (
    authors-names: authors-names,
    authors-data: authors-data,
  )
}

/// Function that creates a grid that aligns up to 3 elements, with one on the left, one in the center and one on the right. Any combination of 1, 2 or 3 of those is possible.
///
/// ->
#let grid-align-left-center-right(
  /// The elements to align in the grid.
  /// The dictionary must contain at least one of the following keys: left, center, right.
  ///
  /// -> any
  elements,
) = {
  let elems = (
    left: elements.at("left", default: none),
    center: elements.at("center", default: none),
    right: elements.at("right", default: none),
  )
  let lcr = (elems.left, elems.center, elems.right)
  if elems.center != none and (elems.left != none or elems.right != none) {
    grid(
      columns: (1fr, 1fr, 1fr),
      align: (left, center, right),
      [#elems.left], [#elems.center], [#elems.right],
    )
  } else {
    let left-col = if elems.left == none { 0em } else { 1fr }
    let center-col = if elems.center == none { 0em } else { 1fr }
    let right-col = if elems.right == none { 0em } else { 1fr }
    grid(
      columns: (left-col, center-col, right-col),
      align: (left, center, right),
      [#elems.left], [#elems.center], [#elems.right],
    )
  }
}
