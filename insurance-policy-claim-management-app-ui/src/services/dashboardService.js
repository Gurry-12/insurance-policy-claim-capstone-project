import axiosInstance from '../api/axiosInstance';

export const getAdminStats = async () => {
  return {
    totalCustomers: await getCustomerCount().catch(() => 0),
    activePolicies: await getTotalActivePolicies().catch(() => 0),
    claims: await getOpenClaimsCount().catch(() => {}),
    activeUsers: await getActiveUsers().catch(() => 0),
    totalProducts: await getTotalProducts().catch(() => 0),
    recentClaims: await getRecentClaims().catch(() => []),
    recentPolicies: await getRecentPolicies().catch(() => [])
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
