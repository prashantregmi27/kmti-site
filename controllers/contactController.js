import Contact from '../models/Contact.js';
import { sendContactEmail } from '../utils/mailer.js';

// @desc   Submit a contact/question
// @route  POST /api/contact
export const createContact = async (req, res) => {
  Contact.create(req.body).catch(() => {});
  try {
    const emailSent = await sendContactEmail(req.body);
    const contactValue = (req.body.contact || '').trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactValue);
    const msg = isEmail && emailSent
      ? 'Your question has been sent! A confirmation has also been emailed to you. We will reply within 24 hours.'
      : 'Your question has been sent! We will reply within 24 hours.';
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
  }
};

// @desc   Get all contacts (admin)
// @route  GET /api/contact
export const getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
