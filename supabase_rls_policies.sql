-- ============================================================
-- PresuXcel — Supabase RLS Policies (Single-line strict formatting)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE labor_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE apu_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE concrete_mixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE heavy_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE goods_receipt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontract_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontract_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Reference Tables
DROP POLICY IF EXISTS "plans_select" ON plans;
CREATE POLICY "plans_select" ON plans FOR SELECT USING (true);

DROP POLICY IF EXISTS "countries_select" ON countries;
CREATE POLICY "countries_select" ON countries FOR SELECT USING (true);

DROP POLICY IF EXISTS "regions_select" ON regions;
CREATE POLICY "regions_select" ON regions FOR SELECT USING (true);

DROP POLICY IF EXISTS "units_select" ON units;
CREATE POLICY "units_select" ON units FOR SELECT USING (true);

-- Auth & Tenancy
DROP POLICY IF EXISTS "organizations_select" ON organizations;
CREATE POLICY "organizations_select" ON organizations FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = organizations.id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "org_members_select" ON org_members;
CREATE POLICY "org_members_select" ON org_members FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "invitations_select" ON invitations;
CREATE POLICY "invitations_select" ON invitations FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = invitations.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "invitations_insert" ON invitations;
CREATE POLICY "invitations_insert" ON invitations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = invitations.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "subscriptions_select" ON subscriptions;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = subscriptions.organization_id AND user_id = auth.uid()));

-- Global + Tenant catalog
DROP POLICY IF EXISTS "catalog_sections_select" ON catalog_sections;
CREATE POLICY "catalog_sections_select" ON catalog_sections FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = catalog_sections.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "materials_select" ON materials;
CREATE POLICY "materials_select" ON materials FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = materials.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "labor_categories_select" ON labor_categories;
CREATE POLICY "labor_categories_select" ON labor_categories FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = labor_categories.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "labor_activities_select" ON labor_activities;
CREATE POLICY "labor_activities_select" ON labor_activities FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = labor_activities.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "equipment_select" ON equipment;
CREATE POLICY "equipment_select" ON equipment FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = equipment.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "apu_templates_select" ON apu_templates;
CREATE POLICY "apu_templates_select" ON apu_templates FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = apu_templates.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "apu_items_select" ON apu_items;
CREATE POLICY "apu_items_select" ON apu_items FOR SELECT USING (EXISTS (SELECT 1 FROM apu_templates a WHERE a.id = apu_items.apu_id AND (a.organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = a.organization_id AND m.user_id = auth.uid()))));

DROP POLICY IF EXISTS "apu_versions_select" ON apu_versions;
CREATE POLICY "apu_versions_select" ON apu_versions FOR SELECT USING (EXISTS (SELECT 1 FROM apu_templates a WHERE a.id = apu_versions.apu_id AND (a.organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = a.organization_id AND m.user_id = auth.uid()))));

DROP POLICY IF EXISTS "concrete_mixes_select" ON concrete_mixes;
CREATE POLICY "concrete_mixes_select" ON concrete_mixes FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = concrete_mixes.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "heavy_equipment_select" ON heavy_equipment;
CREATE POLICY "heavy_equipment_select" ON heavy_equipment FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = heavy_equipment.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "price_lists_select" ON price_lists;
CREATE POLICY "price_lists_select" ON price_lists FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = price_lists.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "resource_prices_select" ON resource_prices;
CREATE POLICY "resource_prices_select" ON resource_prices FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = resource_prices.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "tax_rules_select" ON tax_rules;
CREATE POLICY "tax_rules_select" ON tax_rules FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = tax_rules.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "payment_terms_select" ON payment_terms;
CREATE POLICY "payment_terms_select" ON payment_terms FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = payment_terms.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "exchange_rates_select" ON exchange_rates;
CREATE POLICY "exchange_rates_select" ON exchange_rates FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = exchange_rates.organization_id AND user_id = auth.uid()));

-- Tenant-scoped tables
DROP POLICY IF EXISTS "clients_select" ON clients;
CREATE POLICY "clients_select" ON clients FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = clients.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "clients_insert" ON clients;
CREATE POLICY "clients_insert" ON clients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = clients.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "clients_update" ON clients;
CREATE POLICY "clients_update" ON clients FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = clients.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "clients_delete" ON clients;
CREATE POLICY "clients_delete" ON clients FOR DELETE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = clients.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_select" ON projects FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = projects.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "projects_insert" ON projects;
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = projects.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "projects_update" ON projects;
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = projects.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "projects_delete" ON projects;
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = projects.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "budgets_select" ON budgets;
CREATE POLICY "budgets_select" ON budgets FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = budgets.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "budgets_insert" ON budgets;
CREATE POLICY "budgets_insert" ON budgets FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = budgets.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "budgets_update" ON budgets;
CREATE POLICY "budgets_update" ON budgets FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = budgets.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "suppliers_select" ON suppliers;
CREATE POLICY "suppliers_select" ON suppliers FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = suppliers.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "suppliers_insert" ON suppliers;
CREATE POLICY "suppliers_insert" ON suppliers FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = suppliers.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "suppliers_update" ON suppliers;
CREATE POLICY "suppliers_update" ON suppliers FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = suppliers.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "purchase_orders_select" ON purchase_orders;
CREATE POLICY "purchase_orders_select" ON purchase_orders FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = purchase_orders.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "purchase_orders_insert" ON purchase_orders;
CREATE POLICY "purchase_orders_insert" ON purchase_orders FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = purchase_orders.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "purchase_orders_update" ON purchase_orders;
CREATE POLICY "purchase_orders_update" ON purchase_orders FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = purchase_orders.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "subcontractors_select" ON subcontractors;
CREATE POLICY "subcontractors_select" ON subcontractors FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = subcontractors.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "subcontractors_insert" ON subcontractors;
CREATE POLICY "subcontractors_insert" ON subcontractors FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = subcontractors.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "subcontractors_update" ON subcontractors;
CREATE POLICY "subcontractors_update" ON subcontractors FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = subcontractors.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "subcontracts_select" ON subcontracts;
CREATE POLICY "subcontracts_select" ON subcontracts FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = subcontracts.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "subcontracts_insert" ON subcontracts;
CREATE POLICY "subcontracts_insert" ON subcontracts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = subcontracts.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "subcontracts_update" ON subcontracts;
CREATE POLICY "subcontracts_update" ON subcontracts FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = subcontracts.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "work_progress_select" ON work_progress;
CREATE POLICY "work_progress_select" ON work_progress FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = work_progress.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "work_progress_insert" ON work_progress;
CREATE POLICY "work_progress_insert" ON work_progress FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = work_progress.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "cost_actuals_select" ON cost_actuals;
CREATE POLICY "cost_actuals_select" ON cost_actuals FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = cost_actuals.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "cost_actuals_insert" ON cost_actuals;
CREATE POLICY "cost_actuals_insert" ON cost_actuals FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = cost_actuals.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "quotes_select" ON quotes;
CREATE POLICY "quotes_select" ON quotes FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = quotes.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "quotes_insert" ON quotes;
CREATE POLICY "quotes_insert" ON quotes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = quotes.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "quotes_update" ON quotes;
CREATE POLICY "quotes_update" ON quotes FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = quotes.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "goods_receipts_select" ON goods_receipts;
CREATE POLICY "goods_receipts_select" ON goods_receipts FOR SELECT USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = goods_receipts.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "goods_receipts_insert" ON goods_receipts;
CREATE POLICY "goods_receipts_insert" ON goods_receipts FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = goods_receipts.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "audit_log_select" ON audit_log;
CREATE POLICY "audit_log_select" ON audit_log FOR SELECT USING (organization_id IS NULL OR EXISTS (SELECT 1 FROM org_members WHERE organization_id = audit_log.organization_id AND user_id = auth.uid()));

-- Child tables
DROP POLICY IF EXISTS "budget_levels_select" ON budget_levels;
CREATE POLICY "budget_levels_select" ON budget_levels FOR SELECT USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_levels.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_levels_insert" ON budget_levels;
CREATE POLICY "budget_levels_insert" ON budget_levels FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_levels.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_levels_update" ON budget_levels;
CREATE POLICY "budget_levels_update" ON budget_levels FOR UPDATE USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_levels.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_levels_delete" ON budget_levels;
CREATE POLICY "budget_levels_delete" ON budget_levels FOR DELETE USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_levels.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_chapters_select" ON budget_chapters;
CREATE POLICY "budget_chapters_select" ON budget_chapters FOR SELECT USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_chapters.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_chapters_insert" ON budget_chapters;
CREATE POLICY "budget_chapters_insert" ON budget_chapters FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_chapters.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_chapters_update" ON budget_chapters;
CREATE POLICY "budget_chapters_update" ON budget_chapters FOR UPDATE USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_chapters.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_chapters_delete" ON budget_chapters;
CREATE POLICY "budget_chapters_delete" ON budget_chapters FOR DELETE USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_chapters.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_items_select" ON budget_items;
CREATE POLICY "budget_items_select" ON budget_items FOR SELECT USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_items.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_items_insert" ON budget_items;
CREATE POLICY "budget_items_insert" ON budget_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_items.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_items_update" ON budget_items;
CREATE POLICY "budget_items_update" ON budget_items FOR UPDATE USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_items.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_items_delete" ON budget_items;
CREATE POLICY "budget_items_delete" ON budget_items FOR DELETE USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_items.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_versions_select" ON budget_versions;
CREATE POLICY "budget_versions_select" ON budget_versions FOR SELECT USING (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_versions.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "budget_versions_insert" ON budget_versions;
CREATE POLICY "budget_versions_insert" ON budget_versions FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM budgets b WHERE b.id = budget_versions.budget_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = b.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "apu_templates_insert" ON apu_templates;
CREATE POLICY "apu_templates_insert" ON apu_templates FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM org_members WHERE organization_id = apu_templates.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "apu_templates_update" ON apu_templates;
CREATE POLICY "apu_templates_update" ON apu_templates FOR UPDATE USING (EXISTS (SELECT 1 FROM org_members WHERE organization_id = apu_templates.organization_id AND user_id = auth.uid()));

DROP POLICY IF EXISTS "apu_items_insert" ON apu_items;
CREATE POLICY "apu_items_insert" ON apu_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM apu_templates a WHERE a.id = apu_items.apu_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = a.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "apu_items_update" ON apu_items;
CREATE POLICY "apu_items_update" ON apu_items FOR UPDATE USING (EXISTS (SELECT 1 FROM apu_templates a WHERE a.id = apu_items.apu_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = a.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "apu_items_delete" ON apu_items;
CREATE POLICY "apu_items_delete" ON apu_items FOR DELETE USING (EXISTS (SELECT 1 FROM apu_templates a WHERE a.id = apu_items.apu_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = a.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "purchase_order_items_select" ON purchase_order_items;
CREATE POLICY "purchase_order_items_select" ON purchase_order_items FOR SELECT USING (EXISTS (SELECT 1 FROM purchase_orders p WHERE p.id = purchase_order_items.purchase_order_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = p.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "purchase_order_items_insert" ON purchase_order_items;
CREATE POLICY "purchase_order_items_insert" ON purchase_order_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM purchase_orders p WHERE p.id = purchase_order_items.purchase_order_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = p.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "purchase_order_items_update" ON purchase_order_items;
CREATE POLICY "purchase_order_items_update" ON purchase_order_items FOR UPDATE USING (EXISTS (SELECT 1 FROM purchase_orders p WHERE p.id = purchase_order_items.purchase_order_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = p.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "goods_receipt_items_select" ON goods_receipt_items;
CREATE POLICY "goods_receipt_items_select" ON goods_receipt_items FOR SELECT USING (EXISTS (SELECT 1 FROM goods_receipts g WHERE g.id = goods_receipt_items.receipt_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = g.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "goods_receipt_items_insert" ON goods_receipt_items;
CREATE POLICY "goods_receipt_items_insert" ON goods_receipt_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM goods_receipts g WHERE g.id = goods_receipt_items.receipt_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = g.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "subcontract_milestones_select" ON subcontract_milestones;
CREATE POLICY "subcontract_milestones_select" ON subcontract_milestones FOR SELECT USING (EXISTS (SELECT 1 FROM subcontracts s WHERE s.id = subcontract_milestones.subcontract_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = s.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "subcontract_milestones_insert" ON subcontract_milestones;
CREATE POLICY "subcontract_milestones_insert" ON subcontract_milestones FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM subcontracts s WHERE s.id = subcontract_milestones.subcontract_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = s.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "subcontract_milestones_update" ON subcontract_milestones;
CREATE POLICY "subcontract_milestones_update" ON subcontract_milestones FOR UPDATE USING (EXISTS (SELECT 1 FROM subcontracts s WHERE s.id = subcontract_milestones.subcontract_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = s.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "subcontract_payments_select" ON subcontract_payments;
CREATE POLICY "subcontract_payments_select" ON subcontract_payments FOR SELECT USING (EXISTS (SELECT 1 FROM subcontracts s WHERE s.id = subcontract_payments.subcontract_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = s.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "subcontract_payments_insert" ON subcontract_payments;
CREATE POLICY "subcontract_payments_insert" ON subcontract_payments FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM subcontracts s WHERE s.id = subcontract_payments.subcontract_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = s.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "quote_recipients_select" ON quote_recipients;
CREATE POLICY "quote_recipients_select" ON quote_recipients FOR SELECT USING (EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_recipients.quote_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = q.organization_id AND m.user_id = auth.uid())));

DROP POLICY IF EXISTS "quote_recipients_insert" ON quote_recipients;
CREATE POLICY "quote_recipients_insert" ON quote_recipients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM quotes q WHERE q.id = quote_recipients.quote_id AND EXISTS (SELECT 1 FROM org_members m WHERE m.organization_id = q.organization_id AND m.user_id = auth.uid())));
