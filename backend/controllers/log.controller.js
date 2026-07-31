const MessageLog = require('../models/MessageLog');
const Clinic = require('../models/Clinic');

// @desc    Get all message logs with pagination & filters
// @route   GET /api/logs
// @access  Private
const getLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, clinicId, status, dateFilter, search } = req.query;

    const query = {};

    // 1. Clinic Filter
    if (clinicId) {
      query.clinic = clinicId;
    }

    // 2. Status Filter
    if (status) {
      query.status = status;
    }

    // 3. Date Filter (Today, Yesterday, This Week)
    if (dateFilter) {
      const now = new Date();
      let startDate;

      switch (dateFilter) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query.createdAt = { $gte: startDate };
          break;
        case 'yesterday':
          const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          query.createdAt = { $gte: startOfYesterday, $lt: endOfYesterday };
          break;
        case 'this_week':
          // Start of current week (e.g. Sunday or Monday)
          const day = now.getDay();
          const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
          startDate = new Date(now.setDate(diff));
          startDate.setHours(0, 0, 0, 0);
          query.createdAt = { $gte: startDate };
          break;
        default:
          break;
      }
    }

    // 4. Search Filter (by recipient mobile)
    if (search) {
      query.recipientMobile = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const logs = await MessageLog.find(query)
      .populate('clinic', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await MessageLog.countDocuments(query);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        totalItems: total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard metrics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Total Clinics
    const totalClinics = await Clinic.countDocuments();

    // 2. Sent Today
    const sentToday = await MessageLog.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    // 3. Successful Messages Today
    const successfulToday = await MessageLog.countDocuments({
      status: 'sent',
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    // 4. Failed Messages Today
    const failedToday = await MessageLog.countDocuments({
      status: 'failed',
      createdAt: { $gte: todayStart, $lte: todayEnd }
    });

    // 5. Total Cumulative Stats (extra polish for dashboard)
    const totalSent = await MessageLog.countDocuments();
    const totalSuccessful = await MessageLog.countDocuments({ status: 'sent' });
    const totalFailed = await MessageLog.countDocuments({ status: 'failed' });

    // 6. Recent 10 Message Logs
    const recentLogs = await MessageLog.find()
      .populate('clinic', 'name code')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        metrics: {
          totalClinics,
          today: {
            total: sentToday,
            success: successfulToday,
            failed: failedToday
          },
          cumulative: {
            total: totalSent,
            success: totalSuccessful,
            failed: totalFailed
          }
        },
        recentLogs
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLogs,
  getDashboardStats
};
