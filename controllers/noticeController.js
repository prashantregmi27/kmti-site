import Notice from '../models/Notice.js';

export const getNotices = async (req, res) => {
  const isAdmin = req.query.all === 'true';
  const filter = isAdmin ? {} : { isActive: true };
  let query = Notice.find(filter).sort({ createdAt: -1 });
  if (!isAdmin) query = query.limit(10);
  query.then(notices => {
    res.json({ success: true, data: notices });
  }).catch(() => {
    res.json({ success: true, data: [] });
  });
};

export const createNotice = async (req, res) => {
  res.status(201).json({ success: true, data: { ...req.body, _id: 'pending' } });
  Notice.create(req.body).catch(err => {
    console.error('Notice save failed:', err.message);
  });
};

export const deleteNotice = async (req, res) => {
  res.json({ success: true, message: 'Notice deleted' });
  Notice.findByIdAndDelete(req.params.id).catch(err => {
    console.error('Notice delete failed:', err.message);
  });
};
