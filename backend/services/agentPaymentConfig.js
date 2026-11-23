const prisma = require("./db");
const parsePreferences = value => {
  if (!value) return {};
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : { legacy_preferences: value }; }
  catch { return { legacy_preferences: value }; }
};
const getAgentUpiId = async (userId) => {
  const config = await prisma.agentConfig.findFirst({ select: { preferences: true } });
  const preferences = parsePreferences(config?.preferences);
  return preferences.agent_profiles?.[String(userId)]?.upi_id || preferences.upi_by_user?.[String(userId)] || preferences.upi_id || process.env.UPI_ID || null;
};
const setAgentUpiId = async (userId, upiId) => {
  const config = await prisma.agentConfig.findFirst({ select: { id: true, name: true, preferences: true } });
  const preferences = parsePreferences(config?.preferences);
  const key = String(userId);
  preferences.agent_profiles = { ...(preferences.agent_profiles || {}), [key]: { ...(preferences.agent_profiles?.[key] || {}), upi_id: upiId } };
  if (config) return prisma.agentConfig.update({ where: { id: config.id }, data: { preferences: JSON.stringify(preferences) } });
  return prisma.agentConfig.create({ data: { name: "LocalTrip Agent", preferences: JSON.stringify(preferences) } });
};
const setAgentProfileSettings = async (userId, settings) => {
  const config = await prisma.agentConfig.findFirst({ select: { id: true, preferences: true } });
  const preferences = parsePreferences(config?.preferences);
  const key = String(userId);
  preferences.agent_profiles = { ...(preferences.agent_profiles || {}), [key]: { ...(preferences.agent_profiles?.[key] || {}), settings } };
  if (config) return prisma.agentConfig.update({ where: { id: config.id }, data: { preferences: JSON.stringify(preferences) } });
  return prisma.agentConfig.create({ data: { name: "LocalTrip Agent", preferences: JSON.stringify(preferences) } });
};
module.exports = { getAgentUpiId, setAgentUpiId, setAgentProfileSettings };
