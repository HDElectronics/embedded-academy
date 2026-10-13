// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import type { Source } from './schema.ts';

/** Sources shared by several boards. Each board file adds its own. */
export const KERNEL_ARM_BOOTING: Source = {
  title: 'Linux kernel documentation: Booting ARM Linux',
  url: 'https://www.kernel.org/doc/html/v6.18/arch/arm/booting.html',
};

export const KERNEL_ARM64_BOOTING: Source = {
  title: 'Linux kernel documentation: Booting AArch64 Linux',
  url: 'https://www.kernel.org/doc/html/v6.18/arch/arm64/booting.html',
};

export const RPI_BOOT: Source = {
  title: 'Raspberry Pi documentation: Raspberry Pi hardware, boot sequence and boot EEPROM',
  url: 'https://www.raspberrypi.com/documentation/computers/raspberry-pi.html',
};

export const RPI_CONFIG_TXT: Source = {
  title: 'Raspberry Pi documentation: config.txt',
  url: 'https://www.raspberrypi.com/documentation/computers/config_txt.html',
};

export const UBOOT_RPI: Source = {
  title: 'U-Boot documentation: Raspberry Pi',
  url: 'https://docs.u-boot.org/en/v2026.07/board/broadcom/raspberrypi.html',
};

export const AM335X_TRM: Source = {
  title: 'TI AM335x Sitara Processors Technical Reference Manual (SPRUH73Q)',
  url: 'https://www.ti.com/lit/ug/spruh73q/spruh73q.pdf',
  section: 'Initialization (ROM code)',
};

export const BBB_SRM_BOOT: Source = {
  title: 'BeagleBone Black System Reference Manual: Detailed Hardware Design',
  url: 'https://docs.beagleboard.org/boards/beaglebone/black/ch06.html#default-boot-options',
  section: 'Boot Configuration; Default Boot Options',
};

export const UBOOT_AM335X: Source = {
  title: 'U-Boot documentation: AM335x generic boards',
  url: 'https://docs.u-boot.org/en/v2026.07/board/ti/am335x_evm.html',
};

export const UBOOT_TI_ENV: Source = {
  title: 'U-Boot source: include/configs/ti_armv7_common.h (default load addresses)',
  url: 'https://source.denx.de/u-boot/u-boot/-/blob/v2026.07/include/configs/ti_armv7_common.h',
};

export const STM32MP15_RM: Source = {
  title: 'ST RM0436: STM32MP157 reference manual',
  section: 'Memory map; boot modes',
};

export const TFA_STM32MP1: Source = {
  title: 'Trusted Firmware-A documentation: STMicroelectronics STM32MP1',
  url: 'https://trustedfirmware-a.readthedocs.io/en/lts-v2.14.10/plat/st/stm32mp1.html',
};

/** Names the BL2 image TF-A builds for STM32MP1: tf-a-<dtb name>.stm32. */
export const TFA_STM32MP1_PLATFORM_MK: Source = {
  title: 'TF-A lts-v2.14.10 source: plat/st/stm32mp1/platform.mk',
  url: 'https://github.com/ARM-software/arm-trusted-firmware/blob/lts-v2.14.10/plat/st/stm32mp1/platform.mk',
  section: 'STM32_TF_STM32',
};

export const TFA_STM32MPUS: Source = {
  title: 'Trusted Firmware-A documentation (lts-v2.14.10): STMicroelectronics STM32 MPUs',
  url: 'https://trustedfirmware-a.readthedocs.io/en/lts-v2.14.10/plat/st/stm32mpus.html',
  section: 'Populate SD-card',
};

export const UBOOT_STM32MP1: Source = {
  title: 'U-Boot documentation: STM32MP1 boards',
  url: 'https://docs.u-boot.org/en/v2026.07/board/st/stm32mp1.html',
};

export const UBOOT_STM32MP1_SD: Source = {
  title: 'U-Boot documentation (v2026.07): STM32MP1 boards',
  url: 'https://docs.u-boot.org/en/v2026.07/board/st/stm32mp1.html',
  section: 'Prepare an SD card',
};

/** The SD card Buildroot builds for STM32MP1: fsbl1, fsbl2, fip, then a bootable rootfs. */
export const BUILDROOT_STM32MP1_GENIMAGE: Source = {
  title: 'Buildroot 2026.02.3 source: board/stmicroelectronics/common/stm32mp1xx/genimage.cfg.template',
  url: 'https://gitlab.com/buildroot.org/buildroot/-/blob/2026.02.3/board/stmicroelectronics/common/stm32mp1xx/genimage.cfg.template',
};

export const BUILDROOT_DK2_EXTLINUX: Source = {
  title: 'Buildroot 2026.02.3 source: board/stmicroelectronics/stm32mp157c-dk2/overlay/boot/extlinux/extlinux.conf',
  url: 'https://gitlab.com/buildroot.org/buildroot/-/blob/2026.02.3/board/stmicroelectronics/stm32mp157c-dk2/overlay/boot/extlinux/extlinux.conf',
};

export const OPTEE_PLATFORMS: Source = {
  title: 'OP-TEE documentation: platforms supported',
  url: 'https://optee.readthedocs.io/en/4.10.0/general/platforms.html',
};

export const ARM_ARM_A: Source = {
  title: 'Arm Architecture Reference Manual for A-profile architecture (DDI 0487)',
  url: 'https://developer.arm.com/documentation/ddi0487/latest',
};

export const ARM_ARM_V7A: Source = {
  title: 'ARM Architecture Reference Manual, ARMv7-A and ARMv7-R edition (DDI 0406)',
  url: 'https://developer.arm.com/documentation/ddi0406/latest',
};
