import axiosInstance from '../api/axiosInstance';

export const getAdminStats = async () => {
  const results = await Promise.allSettled([
    getCustomerCount(),
    getTotalActivePolicies(),
    getOpenClaimsCount(),
    getActiveUsers(),
    getTotalProducts(),
    getRecentClaims(),
    getRecentPolicies()
  ]);

  return {
    totalCustomers: results[0].status === 'fulfilled' ? results[0].value : 0,
    activePolicies: results[1].status === 'fulfilled' ? results[1].value : 0,
    claims: results[2].status === 'fulfilled' ? results[2].value : { pendingClaims: 0, reviewedClaims: 0 },
    activeUsers: results[3].status === 'fulfilled' ? results[3].value : 0,
    totalProducts: results[4].status === 'fulfilled' ? results[4].value : 0,
    recentClaims: results[5].status === 'fulfilled' ? results[5].value : [],
    recentPolicies: results[6].status === 'fulfilled' ? results[6].value : []
  };
};


const getOpenClaimsCount = async () => {
  const response = await axiosInstance.get('/claims', {
    params: { pageNumber: 0, pageSize: 100 }
  });
  const claims = response.data?.data?.content || response.data?.content || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  const pending = claims.filter(
    (c) => c.claimStatus === "SUBMITTED" || c.claimStatus === "UNDER_REVIEW",
  ).length;
  const reviewed = claims.filter(
    (c) =>
      c.claimStatus === "APPROVED" ||
      c.claimStatus === "REJECTED" ||
      c.claimStatus === "REVIEWED",
  ).length;

  return {pendingClaims: pending, reviewedClaims: reviewed};
};

const getTotalProducts = async () => {
  const response = await axiosInstance.get('/products/active');
  const products = response.data?.data || response.data?.content || (Array.isArray(response.data) ? response.data : []);
  return products.length;
};

const getActiveUsers = async () => {
  const response = await axiosInstance.get('/users');
  const users = response.data?.data || response.data?.content || (Array.isArray(response.data) ? response.data : []);
  return users.filter(u => u.isActive !== false && u.activeStatus !== false).length;
};

const getCustomerCount = async () =>  {
  const response = await axiosInstance.get("/customers");
  const customers = response.data?.data || response.data?.content || (Array.isArray(response.data) ? response.data : []);
  return customers.length;
};

const getTotalActivePolicies = async () => {
  const response = await axiosInstance.get('/plans/active');
  const plans = response.data?.data || response.data?.content || (Array.isArray(response.data) ? response.data : []);
  return plans.length;
};

const getRecentClaims = async () => {
  const response = await axiosInstance.get('/claims', {
    params: { pageNumber: 0, pageSize: 5 }
  });
  const list = response.data?.data?.content || response.data?.content || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  return list.slice(0, 5).map((c) => ({
    id: c.id || c.claimId || "N/A",
    customerName: c.customerName,
    policyNumber: c.policyNumber || c.policyId || "N/A",
    claimAmount: c.claimAmount || 0,
    type: c.claimType || c.type || "Claim",
    date:
      c.dateFiled ||
      c.date ||
      c.createdAt?.split("T")[0] ||
      new Date().toISOString().split("T")[0],
    status: c.claimStatus,
  }));
};

const getRecentPolicies = async () => {
  const response = await axiosInstance.get('/policies');
  const list = response.data?.data?.content || response.data?.content || response.data?.data || (Array.isArray(response.data) ? response.data : []);
  return list.slice(0, 5).map((p) => ({
    id: p.id || p.policyId || "N/A",
    customerName:
      p.customerName,
    productName: p.productName || p.planName || (p.plan ? p.plan.name : "Plan"),
    premium: p.calculatedPremium,
    status: p.policyStatus,
    startDate:
      p.startDate ||
      p.createdAt?.split("T")[0] ||
      new Date().toISOString().split("T")[0],
  }));
};

export default getAdminStats;
