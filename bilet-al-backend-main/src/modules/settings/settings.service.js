import SystemSettings from './systemSettings.model.js';

export async function getSettings() {
  let settings = await SystemSettings.findOne({ singletonKey: 'default' });
  if (!settings) settings = await SystemSettings.create({ singletonKey: 'default' });
  return settings;
}

export async function updateSettings(payload, user) {
  const settings = await getSettings();
  for (const [key, value] of Object.entries(payload)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) settings[key] = { ...(settings[key]?.toObject?.() ?? settings[key] ?? {}), ...value };
    else settings[key] = value;
  }
  settings.updatedBy = user._id;
  await settings.save();
  return settings;
}
