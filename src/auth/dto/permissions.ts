export const ResourceName = { Article: 'Article' } as const;

export type ResourceName = keyof typeof ResourceName;

export type ResoucePermissionType = {
  [resource in ResourceName]?: {
    create?: boolean;
    view?: boolean;
    update?: boolean;
    delete?: boolean;
  };
};
