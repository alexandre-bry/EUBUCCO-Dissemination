#let _reshape-authors-data(
  authors-data: (:),
  authors-names: (),
) = {
  let authors-len = authors-names.len()
  for key in authors-data.keys() {
    if authors-data.at(key).len() != authors-len {
      panic("The length of the data for each author must match the number of authors.")
    }
  }
  let data = ()
  for i in range(authors-names.len()) {
    let author-name = authors-names.at(i)
    let author-data = authors-data.values().map(t => t.at(i))
    data.push((author-name, ..author-data))
  }
  data
}

#let _author-column(
  author-data-reshaped,
  row-gutter: 0.5em,
) = {
  grid(
    columns: 1,
    align: center,
    row-gutter: row-gutter,
    strong(author-data-reshaped.at(0)),
    ..author-data-reshaped.slice(1),
  )
}

#let authors-centered(
  authors-names: (),
  authors-data: (:),
  max-columns: 2,
  row-gutter: 0.5em,
) = {
  let authors-data-reshaped = _reshape-authors-data(
    authors-data: authors-data,
    authors-names: authors-names,
  )

  let authors-len = authors-names.len()
  if authors-len == 0 {
    return
  }

  let cols = calc.min(max-columns, authors-len)
  let rows = calc.ceil(authors-len / cols)
  let final-row-cols = calc.rem-euclid(authors-len, cols)
  if final-row-cols == 0 { final-row-cols = cols }
  // let actual-cols = calc.lcm(cols, final-row-cols)
  let actual-cols = 2 * cols
  let grid-content = ()

  // Create the cells of the grid (except the last row).
  // let colspan = calc.div-euclid(actual-cols, cols)
  let colspan = 2
  for row in range(0, rows - 1) {
    for col in range(0, cols) {
      let index = row * cols + col
      grid-content.push(grid.cell(colspan: colspan, _author-column(authors-data-reshaped.at(index))))
    }
  }
  // Create the last row of the grid.
  // let colspan = calc.div-euclid(actual-cols, final-row-cols)
  let colspan = 2
  let empty-cols = calc.div-euclid(actual-cols - colspan * final-row-cols, 2)
  let row = rows - 1
  if empty-cols > 0 { grid-content.push(grid.cell(colspan: empty-cols, [])) }
  for col in range(0, final-row-cols) {
    let index = row * cols + col
    grid-content.push(grid.cell(colspan: colspan, _author-column(authors-data-reshaped.at(index))))
  }
  if empty-cols > 0 { grid-content.push(grid.cell(colspan: empty-cols, [])) }

  grid(
    columns: (1fr,) * actual-cols,
    align: center,
    row-gutter: row-gutter,
    ..grid-content,
  )
}

#let authors-grid(
  authors-names: (),
  authors-data: (:),
  alignment: left,
  row-gutter: 0.5em,
  column-gutter: 1em,
  header: true,
) = {
  let authors-data-reshaped = _reshape-authors-data(
    authors-data: authors-data,
    authors-names: authors-names,
  )
  let headers = ("Name", ..authors-data.keys())
  let columns = authors-data.len() + 1
  grid(
    columns: columns,
    align: alignment,
    column-gutter: column-gutter,
    row-gutter: row-gutter,
    if header { grid.header(..headers.map(t => strong(t))) },
    ..authors-data-reshaped.flatten().map(t => [#t])
  )
}

#let background-box(content, background-color, top-space: 1em, bottom-space: 1em, left-space: 1em, right-space: 1em) = {
  rect(
    fill: background-color,
    radius: 1em,
    outset: (
      top: top-space,
      bottom: bottom-space,
      left: left-space,
      right: right-space,
    ),
    stroke: none,
  )[#content]
}

#let gradient-box(content, background-color, top-space: 1em, bottom-space: 1em, use-gradient: false) = {
  let transparent-color = luma(66.67%, 0%)
  if background-color == none { background-color = transparent-color }
  let fill-top = if use-gradient { gradient.linear(transparent-color, background-color, angle: 90deg) } else {
    background-color
  }
  let fill-bottom = if use-gradient { gradient.linear(transparent-color, background-color, angle: 270deg) } else {
    background-color
  }
  rect(
    fill: fill-top,
    height: top-space,
    width: 100cm,
    inset: 0pt,
    outset: 0pt,
  )
  v(top-space, weak: true)
  box(fill: background-color, width: 100%, outset: (x: 10cm, top: top-space, bottom: bottom-space))[#content]
  v(bottom-space, weak: true)
  rect(
    fill: fill-bottom,
    height: bottom-space,
    width: 100cm,
    inset: 0pt,
    outset: 0pt,
  )
}

