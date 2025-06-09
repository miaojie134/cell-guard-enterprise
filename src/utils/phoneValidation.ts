/**
 * 手机号码格式验证工具
 */

// 完整手机号格式：1开头的11位数字
const FULL_PHONE_REGEX = /^1[3-9]\d{9}$/;

// 脱敏手机号格式：1开头3位数字 + **** + 4位数字
const MASKED_PHONE_REGEX = /^1[3-9]\d\*{4}\d{4}$/;

/**
 * 验证手机号码格式（支持完整号码和脱敏格式）
 * @param phoneNumber 手机号码
 * @returns 是否为有效格式
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  const trimmed = phoneNumber.trim();
  return FULL_PHONE_REGEX.test(trimmed) || MASKED_PHONE_REGEX.test(trimmed);
}

/**
 * 判断是否为脱敏格式的手机号
 * @param phoneNumber 手机号码
 * @returns 是否为脱敏格式
 */
export function isMaskedPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  return MASKED_PHONE_REGEX.test(phoneNumber.trim());
}

/**
 * 判断是否为完整格式的手机号
 * @param phoneNumber 手机号码
 * @returns 是否为完整格式
 */
export function isFullPhoneNumber(phoneNumber: string): boolean {
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    return false;
  }

  return FULL_PHONE_REGEX.test(phoneNumber.trim());
}

/**
 * 脱敏手机号码
 * @param phoneNumber 完整手机号码
 * @returns 脱敏后的手机号码
 */
export function maskPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber || !isFullPhoneNumber(phoneNumber)) {
    return phoneNumber;
  }

  const trimmed = phoneNumber.trim();
  return `${trimmed.substring(0, 3)}****${trimmed.substring(7)}`;
}

/**
 * 获取手机号码格式类型
 * @param phoneNumber 手机号码
 * @returns 格式类型描述
 */
export function getPhoneNumberType(phoneNumber: string): 'full' | 'masked' | 'invalid' {
  if (isFullPhoneNumber(phoneNumber)) {
    return 'full';
  } else if (isMaskedPhoneNumber(phoneNumber)) {
    return 'masked';
  } else {
    return 'invalid';
  }
}

/**
 * 格式化手机号码显示
 * @param phoneNumber 手机号码
 * @param forceDisplay 是否强制显示（即使格式无效）
 * @returns 格式化后的显示文本
 */
export function formatPhoneForDisplay(phoneNumber: string, forceDisplay: boolean = false): string {
  if (!phoneNumber) return '';

  const type = getPhoneNumberType(phoneNumber);

  if (type === 'invalid' && !forceDisplay) {
    return '';
  }

  return phoneNumber.trim();
} 