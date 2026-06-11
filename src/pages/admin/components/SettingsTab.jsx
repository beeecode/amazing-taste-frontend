import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogOut, Upload, Save } from 'lucide-react';
import { ChangePasswordModal } from '../../../components/modals/ChangePasswordModal';
import {
  defaultOpeningHours,
  hasInvalidOpeningHours,
  isInvalidOpeningRange,
  normalizeOpeningHours,
  weekDays,
} from '../../../utils/openingHours';
import { validateImageFile, validateSettingsDraft } from '../../../utils/validation';

const itemVariants = {
  visible: { opacity: 1, y: 0, transition: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } },
};

const multilineFields = new Set(['branches']);

function prepareSettingsDraft(settings = {}) {
  if (Object.keys(settings).length === 0) return {};

  return {
    ...settings,
    openingHours: normalizeOpeningHours(settings.openingHours),
  };
}

function formatSettingLabel(key) {
  return key.replace(/([A-Z])/g, ' $1');
}

export default function SettingsTab({ settings, updateSettings, onLogout, showNotice }) {
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [draft, setDraft] = useState(() => prepareSettingsDraft(settings));

  useEffect(() => {
    setDraft(prepareSettingsDraft(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = async () => {
    if (hasInvalidOpeningHours(draft.openingHours)) {
      showNotice('Invalid Opening Hours', 'Opening time must be earlier than closing time for every open day.');
      return;
    }
    const settingsErrors = validateSettingsDraft(draft);
    if (settingsErrors.length > 0) {
      showNotice('Invalid Settings', settingsErrors[0]);
      return;
    }

    await updateSettings(draft);
    showNotice('Settings Saved', 'Restaurant settings are saved locally for backend connection.');
  };

  const handleLogoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const uploadError = validateImageFile(file);

    if (uploadError) {
      event.target.value = '';
      showNotice('Invalid Logo', uploadError);
      return;
    }

    showNotice('Logo Selected', 'Logo upload is ready for backend connection.');
  };

  return (
    <>
      <motion.div className="admin-list-heading" variants={itemVariants}>
        <h1>Settings</h1>
      </motion.div>
      <div className="admin-settings-card settings-grid">
        {Object.entries(draft).map(([key, value]) => (
          key === 'openingHours' ? (
            <OpeningHoursEditor
              key={key}
              value={value}
              onChange={(nextOpeningHours) => updateSetting('openingHours', nextOpeningHours)}
            />
          ) : (
            <label className="admin-form-field" key={key}>
              <span>{formatSettingLabel(key)}</span>
              {multilineFields.has(key) ? (
                <textarea
                  value={value || ''}
                  onChange={(event) => updateSetting(key, event.target.value)}
                  placeholder={key}
                  rows={4}
                />
              ) : (
                <input
                  value={value || ''}
                  onChange={(event) => updateSetting(key, event.target.value)}
                  placeholder={key}
                />
              )}
            </label>
          )
        ))}
        <label className="admin-upload-field admin-logo-upload">
          <span>Logo upload</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleLogoUpload}
          />
          <div className="admin-upload-box">
            <Upload size={24} />
            <strong>Choose logo file</strong>
            <small>PNG, JPG, or WEBP supported</small>
          </div>
        </label>
        <button className="admin-primary-button" type="button" onClick={() => setPasswordOpen(true)}>
          <Lock size={15} strokeWidth={1.8} aria-hidden="true" />
          Change Password
        </button>
        <button className="admin-primary-button" type="button" onClick={saveSettings}>
          <Save size={15} strokeWidth={1.8} aria-hidden="true" />
          Save Settings
        </button>
        <button className="admin-outline-danger" type="button" onClick={onLogout}>
          <LogOut size={15} strokeWidth={1.8} aria-hidden="true" />
          Logout
        </button>
      </div>
      <ChangePasswordModal
        isOpen={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        onSave={() => showNotice('Password Updated', 'Password update flow will be connected with the backend later.')}
      />
    </>
  );
}

function OpeningHoursEditor({ value, onChange }) {
  const openingHours = normalizeOpeningHours(value);

  const updateDay = (dayId, changes) => {
    const currentDay = openingHours[dayId];
    const nextDay = { ...currentDay, ...changes };

    if ('isOpen' in changes) {
      nextDay.openTime = changes.isOpen ? currentDay.openTime || defaultOpeningHours[dayId].openTime : null;
      nextDay.closeTime = changes.isOpen ? currentDay.closeTime || defaultOpeningHours[dayId].closeTime : null;
    }

    onChange({
      ...openingHours,
      [dayId]: nextDay,
    });
  };

  return (
    <section className="opening-hours-section opening-hours-editor" aria-label="Opening hours">
      <div className="opening-hours-heading">
        <span>Opening Hours</span>
        <small>Set the restaurant opening and closing time for each day.</small>
      </div>

      <div className="opening-hours-list">
        {weekDays.map((day) => {
          const daySchedule = openingHours[day.id];
          const isInvalid = isInvalidOpeningRange(daySchedule);

          return (
            <div className={`opening-day-row ${isInvalid ? 'is-invalid' : ''}`} key={day.id}>
              <strong>{day.label}</strong>
              <label className="opening-day-toggle">
                <input
                  checked={daySchedule.isOpen}
                  onChange={(event) => updateDay(day.id, { isOpen: event.target.checked })}
                  type="checkbox"
                />
                <span>{daySchedule.isOpen ? 'Open' : 'Closed'}</span>
              </label>
              <label>
                <span>Opening Time</span>
                <input
                  disabled={!daySchedule.isOpen}
                  max={daySchedule.closeTime || undefined}
                  onChange={(event) => updateDay(day.id, { openTime: event.target.value })}
                  type="time"
                  value={daySchedule.openTime || ''}
                />
              </label>
              <label>
                <span>Closing Time</span>
                <input
                  disabled={!daySchedule.isOpen}
                  min={daySchedule.openTime || undefined}
                  onChange={(event) => updateDay(day.id, { closeTime: event.target.value })}
                  type="time"
                  value={daySchedule.closeTime || ''}
                />
              </label>
              {!daySchedule.isOpen ? <em>Closed</em> : null}
              {isInvalid ? <small>Opening time must be earlier than closing time.</small> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
