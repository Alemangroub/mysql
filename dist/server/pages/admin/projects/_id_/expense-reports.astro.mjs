/* empty css                                          */
import { e as createComponent, k as renderComponent, o as renderScript, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../../../../chunks/astro/server_4YXjuf9l.mjs';
import 'piccolore';
import { $ as $$Layout } from '../../../../chunks/Layout_DCRO8pvN.mjs';
import { $ as $$AdminLogin } from '../../../../chunks/AdminLogin_BIaiut0m.mjs';
import { d as db } from '../../../../chunks/admin_xQC5N2Tr.mjs';
/* empty css                                                    */
export { renderers } from '../../../../renderers.mjs';

const $$Astro = createAstro();
const prerender = false;
const $$ExpenseReports = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$ExpenseReports;
  const { id } = Astro2.params;
  let project = null;
  let expenseReports = [];
  let feedback = { message: "", type: "" };
  if (id) {
    const unreadReportsRef = db.collection("daily_expenses").where("projectId", "==", id).where("isRead", "==", false);
    const unreadReportsSnapshot = await unreadReportsRef.get();
    if (!unreadReportsSnapshot.empty) {
      const batch = db.batch();
      unreadReportsSnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { isRead: true });
      });
      await batch.commit();
    }
  }
  if (Astro2.request.method === "POST") {
    try {
      const formData = await Astro2.request.formData();
      const reportIdToUpdate = formData.get("reportId")?.toString();
      if (!reportIdToUpdate) throw new Error("Report ID is missing.");
      const notes = formData.get("notes")?.toString() || "";
      const newItems = [];
      let totalAmount = 0;
      for (const key of formData.keys()) {
        if (key.startsWith("items[") && key.endsWith("][name]")) {
          const index = key.match(/\d+/)[0];
          const name = formData.get(`items[${index}][name]`)?.toString();
          const amount = parseFloat(formData.get(`items[${index}][amount]`)?.toString() || "0");
          if (name && amount > 0) {
            newItems.push({ name, amount });
            totalAmount += amount;
          }
        }
      }
      await db.collection("daily_expenses").doc(reportIdToUpdate).update({
        notes,
        items: newItems,
        // Overwrite with the corrected items array
        totalAmount,
        expenses: admin.firestore.FieldValue.delete()
        // Clean up the old `expenses` object
      });
      return Astro2.redirect(`/admin/projects/${id}/expense-reports?feedback=updated`);
    } catch (error) {
      console.error("Error updating report:", error);
      return Astro2.redirect(`/admin/projects/${id}/expense-reports?feedback=update_error`);
    }
  }
  const reportIdToDelete = Astro2.url.searchParams.get("delete");
  if (reportIdToDelete) {
    try {
      await db.collection("daily_expenses").doc(reportIdToDelete).delete();
      return Astro2.redirect(`/admin/projects/${id}/expense-reports?feedback=deleted`);
    } catch (error) {
      return Astro2.redirect(`/admin/projects/${id}/expense-reports?feedback=error`);
    }
  }
  const feedbackParam = Astro2.url.searchParams.get("feedback");
  if (feedbackParam === "deleted") feedback = { message: "\u062A\u0645 \u062D\u0630\u0641 \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0628\u0646\u062C\u0627\u062D.", type: "success" };
  if (feedbackParam === "updated") feedback = { message: "\u062A\u0645 \u062A\u062D\u062F\u064A\u062B \u0627\u0644\u062A\u0642\u0631\u064A\u0631 \u0628\u0646\u062C\u0627\u062D.", type: "success" };
  if (feedbackParam === "error") feedback = { message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062D\u0630\u0641.", type: "error" };
  if (feedbackParam === "update_error") feedback = { message: "\u062D\u062F\u062B \u062E\u0637\u0623 \u0623\u062B\u0646\u0627\u0621 \u0627\u0644\u062A\u062D\u062F\u064A\u062B.", type: "error" };
  const formatTimestamp = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return "\u062A\u0627\u0631\u064A\u062E \u063A\u064A\u0631 \u0645\u062A\u0648\u0641\u0631";
    return timestamp.toDate().toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
  };
  try {
    const projectDoc = await db.collection("projects").doc(id).get();
    if (!projectDoc.exists) return Astro2.redirect("/404");
    project = { id: projectDoc.id, ...projectDoc.data() };
    const expenseReportsSnapshot = await db.collection("daily_expenses").where("projectId", "==", id).get();
    expenseReports = expenseReportsSnapshot.docs.map((doc) => {
      const data = doc.data();
      let expenseItems = [];
      if (Array.isArray(data.items) && data.items.length > 0) {
        expenseItems = data.items;
      } else if (data.expenses && typeof data.expenses === "object") {
        expenseItems = Object.keys(data.expenses).map((nameOrKey) => ({
          name: nameOrKey,
          // May still contain the wrong value
          amount: data.expenses[nameOrKey] || 0
        }));
      }
      const calculatedTotal = expenseItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      return {
        id: doc.id,
        ...data,
        expenseItems,
        // Standardized array of items
        totalAmount: calculatedTotal,
        createdAtFormatted: formatTimestamp(data.createdAt)
      };
    }).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  } catch (error) {
    console.error("Error fetching data:", error);
    project = { projectName: "\u062E\u0637\u0623 \u0641\u064A \u062A\u062D\u0645\u064A\u0644 \u0627\u0644\u0628\u064A\u0627\u0646\u0627\u062A" };
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": `\u062A\u0642\u0627\u0631\u064A\u0631 \u0627\u0644\u0645\u0635\u0631\u0648\u0641\u0627\u062A: ${project?.projectName}`, "data-astro-cid-27xd4zxk": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div id="auth-loading-message" class="auth-container" data-astro-cid-27xd4zxk> <p data-astro-cid-27xd4zxk>جارٍ التحقق من صلاحيات الدخول...</p> </div> <div id="admin-login-container" class="auth-container" style="display: none;" data-astro-cid-27xd4zxk> ${renderComponent($$result2, "AdminLogin", $$AdminLogin, { "data-astro-cid-27xd4zxk": true })} </div> <main id="page-content" class="reports-display-page" style="display: none;" data-astro-cid-27xd4zxk> <div class="container" data-astro-cid-27xd4zxk> <header class="page-header" data-astro-cid-27xd4zxk> <div data-astro-cid-27xd4zxk> <h1 data-astro-cid-27xd4zxk>تقارير مصروفات مشروع: ${project.projectName}</h1> <p class="page-subtitle" data-astro-cid-27xd4zxk>عرض وتعديل وحذف تقارير المصروفات مباشرة.</p> </div> <div data-astro-cid-27xd4zxk> <a${addAttribute(`/admin/projects/${id}`, "href")} class="back-link" data-astro-cid-27xd4zxk>&larr; العودة للتفاصيل</a> <button id="logout-button" class="btn-logout" data-astro-cid-27xd4zxk>تسجيل الخروج</button> </div> </header> ${feedback.message && renderTemplate`<div${addAttribute(`feedback-banner ${feedback.type}`, "class")} data-astro-cid-27xd4zxk>${feedback.message}</div>`} <section class="reports-section" data-astro-cid-27xd4zxk> ${expenseReports.length === 0 ? renderTemplate`<div class="no-items-card" data-astro-cid-27xd4zxk><p data-astro-cid-27xd4zxk>لا توجد تقارير مصروفات لهذا المشروع بعد.</p></div>` : renderTemplate`<div class="list-container" data-astro-cid-27xd4zxk> ${expenseReports.map((report) => renderTemplate`<article class="card expense-report-card"${addAttribute(report.id, "data-report-id")} data-astro-cid-27xd4zxk> <div class="card-header" data-astro-cid-27xd4zxk><span data-astro-cid-27xd4zxk>بواسطة: ${report.supervisorName || "\u0645\u0634\u0631\u0641 \u063A\u064A\u0631 \u0645\u062D\u062F\u062F"}</span><time data-astro-cid-27xd4zxk>${report.createdAtFormatted}</time></div>  <div class="card-content view-mode" data-astro-cid-27xd4zxk> <div class="card-body" data-astro-cid-27xd4zxk> <div class="expense-details" data-astro-cid-27xd4zxk> <h4 data-astro-cid-27xd4zxk>تفاصيل المصروفات:</h4> <ul class="expense-list" data-astro-cid-27xd4zxk> ${report.expenseItems && report.expenseItems.filter((item) => item.amount > 0).map((item) => renderTemplate`<li data-astro-cid-27xd4zxk> <span class="expense-name" data-astro-cid-27xd4zxk>${item.name === String(item.amount) ? "\u0628\u0646\u062F \u063A\u064A\u0631 \u0645\u0633\u0645\u0649" : item.name}</span> <span class="expense-amount" data-astro-cid-27xd4zxk>${(item.amount || 0).toLocaleString("ar-EG")} ج.م</span> </li>`)} </ul> <div class="total-amount" data-astro-cid-27xd4zxk> <strong data-astro-cid-27xd4zxk>الإجمالي:</strong> <span data-astro-cid-27xd4zxk>${(report.totalAmount || 0).toLocaleString("ar-EG", { style: "currency", currency: "EGP" })}</span> </div> </div> ${report.notes && renderTemplate`<div class="notes-section" data-astro-cid-27xd4zxk><h4 data-astro-cid-27xd4zxk>ملاحظات:</h4><p data-astro-cid-27xd4zxk>${report.notes}</p></div>`} ${report.imageUrls && report.imageUrls.length > 0 && renderTemplate`<div class="attachments" data-astro-cid-27xd4zxk> <h3 class="attachments-title" data-astro-cid-27xd4zxk>المرفقات:</h3> <div class="image-gallery" data-astro-cid-27xd4zxk> ${report.imageUrls.map((url) => renderTemplate`<a${addAttribute(url, "href")} target="_blank" rel="noopener noreferrer" class="image-thumbnail" data-astro-cid-27xd4zxk> <img${addAttribute(url, "src")} alt="صورة مرفقة" loading="lazy" data-astro-cid-27xd4zxk> </a>`)} </div> </div>`} </div> <div class="card-footer" data-astro-cid-27xd4zxk> <button type="button" class="action-btn edit-btn-toggle" data-astro-cid-27xd4zxk>تعديل</button> <button type="button" class="action-btn delete-btn"${addAttribute(`/admin/projects/${id}/expense-reports?delete=${report.id}`, "data-delete-url")} data-astro-cid-27xd4zxk>حذف</button> </div> </div>  <div class="card-content edit-mode" style="display: none;" data-astro-cid-27xd4zxk> <form method="POST" class="edit-form" data-astro-cid-27xd4zxk> <input type="hidden" name="reportId"${addAttribute(report.id, "value")} data-astro-cid-27xd4zxk> <div class="edit-form-body" data-astro-cid-27xd4zxk> <h4 data-astro-cid-27xd4zxk>تعديل بنود المصروفات:</h4> <div class="edit-grid"${addAttribute(`edit-items-${report.id}`, "id")} data-astro-cid-27xd4zxk> ${report.expenseItems.map((item, index) => renderTemplate`<div class="input-group-wrapper" data-astro-cid-27xd4zxk> <div class="input-group" data-astro-cid-27xd4zxk> <label${addAttribute(`item-name-${report.id}-${index}`, "for")} data-astro-cid-27xd4zxk>اسم البند</label> <input type="text"${addAttribute(`item-name-${report.id}-${index}`, "id")}${addAttribute(`items[${index}][name]`, "name")}${addAttribute(item.name, "value")} data-astro-cid-27xd4zxk> </div> <div class="input-group" data-astro-cid-27xd4zxk> <label${addAttribute(`item-amount-${report.id}-${index}`, "for")} data-astro-cid-27xd4zxk>المبلغ</label> <input type="number" step="0.01"${addAttribute(`item-amount-${report.id}-${index}`, "id")}${addAttribute(`items[${index}][amount]`, "name")}${addAttribute(item.amount, "value")} class="item-amount-input" data-astro-cid-27xd4zxk> </div> </div>`)} </div> <div class="input-group" data-astro-cid-27xd4zxk> <label${addAttribute(`notes-${report.id}`, "for")} data-astro-cid-27xd4zxk>ملاحظات</label> <textarea${addAttribute(`notes-${report.id}`, "id")} name="notes" class="notes-input" data-astro-cid-27xd4zxk>${report.notes}</textarea> </div> <div class="total-recalc" data-astro-cid-27xd4zxk> <strong data-astro-cid-27xd4zxk>الإجمالي الجديد:</strong> <span${addAttribute(`total-recalc-${report.id}`, "id")} data-astro-cid-27xd4zxk>${(report.totalAmount || 0).toLocaleString("ar-EG", { style: "currency", currency: "EGP" })}</span> </div> </div> <div class="card-footer" data-astro-cid-27xd4zxk> <button type="button" class="action-btn cancel-btn-toggle" data-astro-cid-27xd4zxk>إلغاء</button> <button type="submit" class="action-btn save-btn" data-astro-cid-27xd4zxk>حفظ التعديلات</button> </div> </form> </div> </article>`)} </div>`} </section> </div>  <div id="delete-modal" class="modal-overlay" data-astro-cid-27xd4zxk> <div class="modal-content" data-astro-cid-27xd4zxk> <p data-astro-cid-27xd4zxk>هل أنت متأكد أنك تريد حذف هذا التقرير؟</p> <div class="modal-actions" data-astro-cid-27xd4zxk> <button id="cancel-delete-btn" class="action-btn cancel-btn-toggle" data-astro-cid-27xd4zxk>إلغاء</button> <a id="confirm-delete-btn" href="#" class="action-btn delete-btn" data-astro-cid-27xd4zxk>نعم، حذف</a> </div> </div> </div> </main> ` })} ${renderScript($$result, "/home/user/eleman-company/src/pages/admin/projects/[id]/expense-reports.astro?astro&type=script&index=0&lang.ts")} `;
}, "/home/user/eleman-company/src/pages/admin/projects/[id]/expense-reports.astro", void 0);

const $$file = "/home/user/eleman-company/src/pages/admin/projects/[id]/expense-reports.astro";
const $$url = "/admin/projects/[id]/expense-reports";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$ExpenseReports,
    file: $$file,
    prerender,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
