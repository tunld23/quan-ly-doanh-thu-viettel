import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'src/config/m2m_keywords.json');

// Ensure the config file exists
const ensureConfigExists = () => {
  if (!fs.existsSync(configPath)) {
    const defaultData = ["m2m", "evnblu", "dbiz10_1", "sd70ts"];
    fs.writeFileSync(configPath, JSON.stringify(defaultData, null, 2));
  }
};

export const getSetting = async (req, res) => {
  try {
    ensureConfigExists();
    const data = fs.readFileSync(configPath, 'utf8');
    const value = JSON.parse(data);
    
    // For compatibility with the previous frontend code
    // We ignore req.params.key and always return the m2m_keywords
    res.json({ key: 'm2m_keywords', value });
  } catch (err) {
    console.error("Get Config Error:", err);
    res.status(500).json({ error: "Failed to get config" });
  }
};

export const updateSetting = async (req, res) => {
  try {
    const { value } = req.body;
    
    if (!value || !Array.isArray(value)) {
      return res.status(400).json({ error: "Value must be an array" });
    }

    // Force lowercase and trim
    const cleanValue = value.map(v => String(v).trim().toLowerCase()).filter(v => v);

    fs.writeFileSync(configPath, JSON.stringify(cleanValue, null, 2));

    res.json({ message: "Setting updated successfully", key: 'm2m_keywords' });
  } catch (err) {
    console.error("Update Config Error:", err);
    res.status(500).json({ error: "Failed to update config" });
  }
};
