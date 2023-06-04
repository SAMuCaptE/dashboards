export function flatten(obj, prefix = "") {
  if (typeof obj !== "object") {
    throw new Error("Invalid param 'obj'");
  }

  let result = {};
  const keys = Object.keys(obj);

  for (const key of keys) {
    const value = obj[key];
    if (Array.isArray(value)) {
      result = {
        ...result,
        [prefix + key]: value.map((element) => flatten(element)),
      };
    } else if (typeof value === "object") {
      result = { ...result, ...flatten(value, prefix + key + ".") };
    } else {
      result[prefix + key] = value;
    }
  }
  return result;
}

export function mergeDeep(...objects) {
  const isObject = (obj) => obj && typeof obj === "object";

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.map((val, index) => mergeDeep(val, oVal[index]));
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal, oVal);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}
