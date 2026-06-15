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
  Notice.create(req.body).then(notice => {
    res.status(201).json({ success: true, data: notice });
  }).catch(err => {
    res.status(400).json({ success: false, message: err.message });
  });
};

export const deleteNotice = async (req, res) => {
  Notice.findByIdAndDelete(req.params.id).then(() => {
    res.json({ success: true, message: 'Notice deleted' });
  }).catch(err => {
    res.status(500).json({ success: false, message: err.message });
  });
};
