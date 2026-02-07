import { useState, useEffect, useCallback } from "react";
import { type System } from "../capabilities/system";
import { type BillingCapability } from "../capabilities/billing";
import {
  type ProjectId,
  type BillableId,
  type Billable,
  recurrenceStr,
} from "../types/domain";
import { type ProjectListCapability } from "../capabilities/project";
import { formatZec } from "../types/zcash";
import { ProjectSelector } from "../components/ProjectSelector";
import { CreateBillableModal } from "../modals/CreateBillableModal";
import { PaymentRequestModal } from "../modals/PaymentRequestModal";

interface BillingPageProps {
  system: System;
  caps: BillingCapability;
  projectCaps: ProjectListCapability;
  selectedProject: ProjectId | null;
  onProjectChange: (pid: ProjectId) => void;
}

export function BillingPage({
  system,
  caps,
  projectCaps,
  selectedProject,
  onProjectChange,
}: BillingPageProps) {
  const [billables, setBillables] = useState<Array<[BillableId, Billable]>>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentBillableId, setPaymentBillableId] = useState<BillableId | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const loadBillables = useCallback(
    async (pid: ProjectId) => {
      setLoading(true);
      const result = await caps.listBillables(pid);
      if (result.type === "right") {
        setBillables(result.value);
      } else {
        system.error("Failed to load billables.");
      }
      setLoading(false);
    },
    [caps, system],
  );

  useEffect(() => {
    if (selectedProject) {
      void loadBillables(selectedProject);
    } else {
      setBillables([]);
    }
  }, [selectedProject, loadBillables]);

  function handleBillableCreated(_bid: BillableId) {
    if (selectedProject) {
      void loadBillables(selectedProject);
    }
  }

  if (!selectedProject) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="w-64">
            <ProjectSelector
              system={system}
              caps={projectCaps}
              selectedProject={selectedProject}
              onProjectChange={onProjectChange}
            />
          </div>
          <p className="text-gray-500">Select a project to view billing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="w-64">
          <ProjectSelector
            system={system}
            caps={projectCaps}
            selectedProject={selectedProject}
            onProjectChange={onProjectChange}
          />
        </div>

        {loading && <p className="text-gray-500 text-sm">Loading...</p>}

        {!loading && billables.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b font-bold">
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Recurrence</th>
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {billables.map(([bid, b]) => (
                <tr key={bid} className="border-b">
                  <td className="px-4 py-2">{b.name}</td>
                  <td className="px-4 py-2">{b.description}</td>
                  <td className="px-4 py-2">{formatZec(b.amount)}</td>
                  <td className="px-4 py-2">{recurrenceStr(b.recurrence)}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setPaymentBillableId(bid)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      New payment request
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && billables.length === 0 && (
          <p className="text-gray-500 text-sm">No billables yet.</p>
        )}

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          Create billable
        </button>
      </div>

      <CreateBillableModal
        system={system}
        caps={caps.createCaps}
        projectId={selectedProject}
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onBillableCreated={handleBillableCreated}
      />
      <PaymentRequestModal
        system={system}
        caps={caps.paymentRequestCaps}
        projectId={selectedProject}
        billableId={paymentBillableId}
        open={paymentBillableId !== null}
        onClose={() => setPaymentBillableId(null)}
      />
    </div>
  );
}
