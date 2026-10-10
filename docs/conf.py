# SPDX-FileCopyrightText: Embedded Academy contributors
# SPDX-License-Identifier: MIT
"""Sphinx configuration for the Embedded Academy project docs."""

project = "Embedded Academy"
author = "Embedded Academy contributors"
copyright = "Embedded Academy contributors"  # noqa: A001 (Sphinx setting name)
language = "en"

extensions = [
    "myst_parser",
    "sphinx_copybutton",
    "sphinx_design",
    "sphinxcontrib.mermaid",
    "sphinx.ext.intersphinx",
]

source_suffix = {".md": "markdown"}
root_doc = "index"
exclude_patterns = ["_build", ".venv", "Thumbs.db", ".DS_Store", "requirements.*"]

# MyST Markdown
myst_enable_extensions = ["colon_fence", "deflist", "fieldlist"]
myst_heading_anchors = 3

# Intersphinx: each inventory below was checked to exist (HTTP 200 on its
# objects.inv) on 2026-10-11. Add a new one only after the same check.
intersphinx_mapping = {
    "sphinx": ("https://www.sphinx-doc.org/en/master", None),
    "myst": ("https://myst-parser.readthedocs.io/en/latest", None),
}

# Copy buttons skip prompts and output lines.
copybutton_prompt_text = r"\$ "
copybutton_prompt_is_regexp = True
copybutton_only_copy_prompt_lines = False

# HTML output
pygments_style = "tango"
pygments_dark_style = "native"
html_theme = "furo"
html_title = "Embedded Academy docs"
html_static_path = ["_static"]
html_css_files = ["embedded-academy.css"]
# Add "source_repository" to html_theme_options once the public GitHub URL exists.
