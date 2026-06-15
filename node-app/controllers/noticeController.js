import Notice from '../models/Notice.js';

export const getNotices = async (req, res) => {
  try {
    const isAdmin = req.query.all === 'true';
    const filter = isAdmin ? {} : { isActive: true };
    const notices = await Notice.find(filter).sort({ createdAt: -1 }).limit(isAdmin ? 0 : 10);
    res.json({ success: true, data: notices });
  } catch (err) {
    console.error('Get notices failed:', err.message);
    res.json({ success: true, data: [] });
  }
};

export const createNotice = async (req, res) => {
  try {
    const notice = await Notice.create(req.body);
    res.status(201).json({ success: true, data: notice });
  } catch (err) {
    console.error('Notice save failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to save notice' });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    await Notice.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notice deleted' });
  } catch (err) {
    console.error('Notice delete failed:', err.message);
    res.status(500).json({ success: false, message: 'Failed to delete notice' });
  }
};
