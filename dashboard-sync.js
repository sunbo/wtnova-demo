(function (global) {
  const STORAGE_PREFIX = "zuozhanshi_v6_dashboard";
  const DETAIL_KEYS = ["finance", "product", "delivery", "solution", "hr"];

  function storageKey(type, departmentKey) {
    return `${STORAGE_PREFIX}:${type}:${departmentKey}`;
  }

  function safeParse(text, fallback) {
    if (!text) return fallback;
    try {
      return JSON.parse(text);
    } catch (error) {
      return fallback;
    }
  }

  function deepClone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function dispatchSyncEvent(detail) {
    try {
      global.dispatchEvent(new CustomEvent("dashboard-sync", { detail }));
    } catch (error) {
      // ignore
    }
  }

  function getStoredPageState(departmentKey, fallback) {
    const raw = safeParse(global.localStorage.getItem(storageKey("page", departmentKey)), null);
    if (!raw) return deepClone(fallback);
    return raw;
  }

  function getDepartmentData(departmentKey) {
    return safeParse(global.localStorage.getItem(storageKey("normalized", departmentKey)), null);
  }

  function getAllDepartmentData() {
    const result = {};
    DETAIL_KEYS.forEach((key) => {
      result[key] = getDepartmentData(key);
    });
    return result;
  }

  function persistDepartment(departmentKey, pageState, normalizedState) {
    if (!departmentKey) return;
    global.localStorage.setItem(storageKey("page", departmentKey), JSON.stringify(pageState || null));
    global.localStorage.setItem(storageKey("normalized", departmentKey), JSON.stringify(normalizedState || null));
    dispatchSyncEvent({ departmentKey, normalizedState });
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      return function unsubscribe() {};
    }

    const handleStorage = function (event) {
      if (!event.key || event.key.indexOf(`${STORAGE_PREFIX}:normalized:`) !== 0) return;
      const departmentKey = event.key.split(":").pop();
      listener({
        departmentKey,
        normalizedState: safeParse(event.newValue, null)
      });
    };

    const handleCustom = function (event) {
      listener(event.detail || {});
    };

    global.addEventListener("storage", handleStorage);
    global.addEventListener("dashboard-sync", handleCustom);

    return function unsubscribe() {
      global.removeEventListener("storage", handleStorage);
      global.removeEventListener("dashboard-sync", handleCustom);
    };
  }

  global.DashboardSync = {
    DETAIL_KEYS,
    deepClone,
    getStoredPageState,
    getDepartmentData,
    getAllDepartmentData,
    persistDepartment,
    subscribe
  };
})(window);
