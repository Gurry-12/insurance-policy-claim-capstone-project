import { useEffect, useState } from "react";
import { getMyPayments } from "../../../services/paymentService";
import PageHeader from "../../../components/common/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";
import { FileText } from "lucide-react";
import ExportButton from "../../../components/common/ExportButton";
import DataTable from "../../../components/tables/DataTable";
import { formatINR } from "../../../utils/formatters";

const CustomerPaymentHistoryPage = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await getMyPayments();
      const data = response.data || response.content || [];
      const sortedData = [...data].sort((a, b) => (b.paymentId || b.id || 0) - (a.paymentId || a.id || 0));
      setPayments(sortedData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const columns = [
    { 
      header: "Sr. No.",
      cell: (row, index) => index + 1, 
      minWidth: "85px" 
    },
    { header: "Policy Number", cell: (row) => <span className="fw-semibold">{row.policyNumber}</span> },
    {
      header: "Amount (₹)",
      cell: (row) => <span className="fw-semibold">{formatINR(row.amount)}</span>,
    },
    { header: "Payment Mode", accessor: "paymentMode" },
    { header: "Transaction Ref", accessor: "transactionReference" },
    {
      header: "Status",
      cell: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      header: "Payment Date",
      cell: (row) => row.paymentDate ? new Date(row.paymentDate).toLocaleString() : "-",
    },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Payment History"
        subtitle="View all your past and recent premium payments"
        icon={FileText}
        action={
          <ExportButton
              fetchAll={async () => {
                const res = await getMyPayments();
                return res.data || res.content || [];
              }}
            columns={[
              { header: "Policy Number", accessor: "policyNumber" },
              { header: "Amount (₹)", accessor: "amount" },
              { header: "Payment Mode", accessor: "paymentMode" },
              { header: "Status", accessor: "paymentStatus" },
              { header: "Reference", accessor: "transactionReference" },
              { header: "Payment Date", accessor: "paymentDate" }
            ]}
            filename="my_payments.csv"
          />
        }
      />

      <div className="card border-0 shadow-sm mt-4" style={{ borderRadius: 16 }}>
        <div className="card-body p-0">
          <div className="p-4 border-bottom border-light">
            <h6 className="mb-0 fw-bold text-primary">All Payments</h6>
          </div>
          <div className="p-4">
            <DataTable
              columns={columns}
              data={payments}
              loading={loading}
              emptyMessage="No Payments Found"
              emptyIcon={<FileText size={48} className="mb-3 text-secondary opacity-50" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerPaymentHistoryPage;
