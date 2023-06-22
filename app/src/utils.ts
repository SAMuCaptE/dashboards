export function mergeDeep(...objects: Record<string, unknown>[]) {
  const isObject = (obj: any) => obj && typeof obj === "object";

  return objects.reduce((prev, obj) => {
    Object.keys(obj).forEach((key) => {
      const pVal = prev[key];
      const oVal = obj[key];

      if (Array.isArray(pVal) && Array.isArray(oVal)) {
        prev[key] = pVal.map((val, index) => mergeDeep(val, oVal[index]));
      } else if (isObject(pVal) && isObject(oVal)) {
        prev[key] = mergeDeep(pVal as Record<string, unknown>, oVal as Record<string, unknown>);
      } else {
        prev[key] = oVal;
      }
    });

    return prev;
  }, {});
}