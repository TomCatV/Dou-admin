export type ShopContactType = "phone" | "qq" | "email";

export type ShopContactValidation = {
  ok: boolean;
  type: ShopContactType | "";
  normalized: string;
  message: string;
};

const PHONE_RE = /^(?:\+?86)?(1[3-9]\d{9})$/;
const QQ_RE = /^[1-9]\d{4,11}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function cleanText(value: string) {
  return String(value || "").trim();
}

function compactText(value: string) {
  return cleanText(value).replace(/[\s-]+/g, "");
}

export function validateShopContact(value: string): ShopContactValidation {
  const raw = cleanText(value);
  if (!raw) {
    return {
      ok: false,
      type: "",
      normalized: "",
      message: "请填写手机号、QQ号或邮箱"
    };
  }

  const compact = compactText(raw);
  const phoneMatch = compact.match(PHONE_RE);
  if (phoneMatch) {
    return {
      ok: true,
      type: "phone",
      normalized: phoneMatch[1],
      message: ""
    };
  }

  if (EMAIL_RE.test(raw)) {
    return {
      ok: true,
      type: "email",
      normalized: raw.toLowerCase(),
      message: ""
    };
  }

  if (QQ_RE.test(compact)) {
    return {
      ok: true,
      type: "qq",
      normalized: compact,
      message: ""
    };
  }

  return {
    ok: false,
    type: "",
    normalized: "",
    message: "请填写有效的手机号、QQ号或邮箱"
  };
}
