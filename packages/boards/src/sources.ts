// SPDX-FileCopyrightText: Embedded Academy contributors
// SPDX-License-Identifier: MIT

import type { Source } from './schema.ts';

/** Sources shared by several boards. Each board file adds its own. */
export const KERNEL_ARM_BOOTING: Source = {
  title: 'Linux kernel documentation: Booting ARM Linux',
  url: 'https://docs.kernel.org/arch/arm/booting.html',
};

export const KERNEL_ARM64_BOOTING: Source = {
  title: 'Linux kernel documentation: Booting AArch64 Linux',
  url: 'https://docs.kernel.org/arch/arm64/booting.html',
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
  url: 'https://docs.u-boot.org/en/latest/board/broadcom/raspberrypi.html',
};

export const AM335X_TRM: Source = {
  title: 'TI AM335x Sitara Processors Technical Reference Manual (SPRUH73Q)',
  url: 'https://www.ti.com/lit/ug/spruh73q/spruh73q.pdf',
  section: 'Initialization (ROM code)',
};

export const UBOOT_AM335X: Source = {
  title: 'U-Boot documentation: AM335x generic boards',
  url: 'https://docs.u-boot.org/en/latest/board/ti/am335x_evm.html',
};

export const UBOOT_TI_ENV: Source = {
  title: 'U-Boot source: include/configs/ti_armv7_common.h (default load addresses)',
  url: 'https://source.denx.de/u-boot/u-boot/-/blob/master/include/configs/ti_armv7_common.h',
};

export const BBB_SRM_DDR: Source = {
  title: 'BeagleBone Black System Reference Manual: BeagleBone Black High Level Specification',
  url: 'https://docs.beagleboard.org/boards/beaglebone/black/ch05.html#mb-ddr3l',
  section: '512MB DDR3L',
};

export const STM32MP15_RM: Source = {
  title: 'ST RM0436: STM32MP157 reference manual',
  section: 'Memory map; boot modes',
};

export const TFA_STM32MP1: Source = {
  title: 'Trusted Firmware-A documentation: STMicroelectronics STM32MP1',
  url: 'https://trustedfirmware-a.readthedocs.io/en/latest/plat/st/stm32mp1.html',
};

export const UBOOT_STM32MP1: Source = {
  title: 'U-Boot documentation: STM32MP1 boards',
  url: 'https://docs.u-boot.org/en/latest/board/st/stm32mp1.html',
};

export const OPTEE_PLATFORMS: Source = {
  title: 'OP-TEE documentation: platforms supported',
  url: 'https://optee.readthedocs.io/en/latest/general/platforms.html',
};

export const ARM_ARM_A: Source = {
  title: 'Arm Architecture Reference Manual for A-profile architecture (DDI 0487)',
  url: 'https://developer.arm.com/documentation/ddi0487/latest',
};

export const ARM_ARM_V7A: Source = {
  title: 'ARM Architecture Reference Manual, ARMv7-A and ARMv7-R edition (DDI 0406)',
  url: 'https://developer.arm.com/documentation/ddi0406/latest',
};
