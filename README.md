# Dissemination of EUBUCCO

Group project as part of the GEO5019-2025 course at TU Delft.
The goal of this project is to make accessing the [EUBUCCO dataset](https://eubucco.com/data/) quicker and more customizable, both in terms of download and visualization.

A few useful links:

- Website: <https://alexandre-bry.github.io/EUBUCCO-Dissemination/>
- Data: <https://source.coop/abry-tudelft/eubucco>

## Installation

### Code

The code for data conversion is in [`./data_conversions/`](./data_conversions/).
First, install `uv`.
Then, you can install the project with:

```bash
cd data_conversions
uv sync                     # to install packages
```

After that, any command can be run by either activating the environment or running `uv run <command>` such as `uv run python main.py`.

### Website

The code for the website is in [`./website/`](./website/).
First install `npm`.
Then, you can run the website with:

```bash
cd website
npm ci              # to install packages
npm run dev:host    # to run
```
