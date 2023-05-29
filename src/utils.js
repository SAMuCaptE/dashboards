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
