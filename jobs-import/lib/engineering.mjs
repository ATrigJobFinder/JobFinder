// Only engineering jobs are kept for now. To widen it later, edit ENGINEERING below, or set "engineering_only": false in config/search.json.
const ENGINEERING = /\b(engineer(s|ing)?|engineered|draft(s|er|ers|person|man|woman|ing)|cad|geotechnic\w*|hydrolog\w*|hydraulic\w*|structural|mechatronic\w*|reliability|commissioning|metallurg\w*|geolog\w*|survey(or|ing)|process control|scada|plc|instrumentation|asset (management|integrity)|estimator|technologist|firmware|embedded)\b/i;
const NOT_ENGINEERING = /\b(sales engineer|customer engineer|recruit\w*|social engineering)\b/i;
export function isEngineering({ title = "", category = "" } = {}) {
  if (NOT_ENGINEERING.test(title)) return false;
  return ENGINEERING.test(title) || /engineering/i.test(category);
}
