import sequelize from '../config/database.js';

let collaboratorsTableCache = null;

async function getCollaboratorsTable() {
  if (collaboratorsTableCache) return collaboratorsTableCache;
  try {
    collaboratorsTableCache = await sequelize.getQueryInterface().describeTable('collaborators');
  } catch {
    collaboratorsTableCache = {};
  }
  return collaboratorsTableCache;
}

/**
 * Attributes Sequelize an toàn theo cột thực tế trong DB (tránh Unknown column khi model mới hơn schema).
 */
export async function getCollaboratorQueryAttributes(CollaboratorModel) {
  if (!CollaboratorModel?.rawAttributes) return undefined;
  const table = await getCollaboratorsTable();
  const present = [];
  for (const [attrName, def] of Object.entries(CollaboratorModel.rawAttributes)) {
    const col = def.field || attrName;
    if (table[col]) present.push(attrName);
  }
  const expected = Object.keys(CollaboratorModel.rawAttributes).length;
  if (present.length >= expected) return undefined;
  return present.length ? present : ['id', 'email', 'password', 'status', 'approvedAt'];
}

export function applyCollaboratorFindOptionsHook(CollaboratorModel) {
  if (!CollaboratorModel?.addHook) return;

  CollaboratorModel.addHook('beforeFind', async (options) => {
    const table = await getCollaboratorsTable();
    if (!table.deleted_at && options.paranoid !== false) {
      options.paranoid = false;
    }
    if (options.attributes) return;
    const attrs = await getCollaboratorQueryAttributes(CollaboratorModel);
    if (attrs) options.attributes = attrs;
  });
}
