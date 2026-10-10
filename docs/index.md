<!--
SPDX-FileCopyrightText: Embedded Academy contributors
SPDX-License-Identifier: CC-BY-SA-4.0
-->

# Embedded Academy project docs

Embedded Academy is an open-source platform of animated courses on embedded systems. The first course, `linux-boot-arm`, shows how Linux boots on ARM, from the boot ROM to PID 1, on the Raspberry Pi 4, the BeagleBone Black and the STM32MP157 DK2.

These docs are for people who build the platform and write its courses. The courses themselves live on the site, not here.

The docs follow [Diátaxis](https://diataxis.fr/). Pick the section that matches what you need right now:

[Tutorials](tutorials/index.md)
: You are new to the project and want a guided first run.

[How-to guides](how-to/index.md)
: You have a task to finish, such as writing a lesson or cutting a release.

[Reference](reference/index.md)
: You need an exact fact: a command, a frontmatter field, a commit type.

[Explanation](explanation/index.md)
: You want to know why the project works the way it does, including its recorded decisions.

```{toctree}
:hidden:
:maxdepth: 2

tutorials/index
how-to/index
reference/index
explanation/index
```
