export const ADMIN_EMAIL = "musabmuhammadabubakar@gmail.com";
const ACTING_SHOP_KEY = "nakudin_admin_acting_shop_id";

export function isAdminEmail(email?: string | null) {
  return email === ADMIN_EMAIL;
}

export function getActingShopId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACTING_SHOP_KEY);
}

export function setActingShopId(shopId: string) {
  window.localStorage.setItem(ACTING_SHOP_KEY, shopId);
  window.dispatchEvent(new CustomEvent("nakudin-admin-acting-shop-change", { detail: { shopId } }));
}

export function clearActingShopId() {
  window.localStorage.removeItem(ACTING_SHOP_KEY);
  window.dispatchEvent(new CustomEvent("nakudin-admin-acting-shop-change", { detail: { shopId: null } }));
}
