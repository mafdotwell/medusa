import { i } from "@instantdb/admin"

/**
 * InstantDB Schema
 * Defines the data models for the marketplace application
 */
export const schema = i.schema({
  entities: {
    vendors: i.entity({
      name: i.string(),
      handle: i.string().optional(),
      logo: i.string().optional(),
      created_at: i.number(),
      updated_at: i.number(),
    }),
    vendor_admins: i.entity({
      email: i.string(),
      vendor_id: i.string(),
      first_name: i.string().optional(),
      last_name: i.string().optional(),
      created_at: i.number(),
      updated_at: i.number(),
    }),
    // File uploads metadata
    files: i.entity({
      path: i.string(),
      url: i.string(),
      vendor_id: i.string(),
      folder: i.string().optional(),
      original_name: i.string(),
      file_type: i.string(),
      file_size: i.number(),
      is_private: i.boolean(),
      uploaded_by: i.string(),
      created_at: i.number(),
    }),
  },
  links: {
    vendor_admins: {
      vendor: { type: "vendors" },
    },
    files: {
      vendor: { type: "vendors" },
    },
  },
})

export default schema

