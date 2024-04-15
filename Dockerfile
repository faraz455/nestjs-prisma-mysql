###################
# BUILD FOR LOCAL DEVELOPMENT
###################

FROM node:18-alpine As development

# Create app directory
WORKDIR /charms

# Copy application dependency manifests to the container image.
COPY --chown=node:node package*.json ./

# Bundle app source
COPY --chown=node:node . .

# Clean install dependecies
RUN rm -rf node_modules \
    && yarn install --frozen-lockfile \
    && yarn prisma generate

# Use the node user from the image (instead of the root user)
USER node

###################
# BUILD FOR PRODUCTION
###################
FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

# In order to run `yarn build` we need access to the Nest CLI which is a dev dependency. In the previous development stage we ran `npm ci` which installed all dependencies
# In the previous dev stage we installed all dependencies, so we can copy over 
# the node_modules directory from the dev image
COPY --chown=node:node --from=development /charms/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN yarn build

# Set NODE_ENV environment variable
ENV NODE_ENV production

# Passing in --prod=true ensures that only the production dependencies are installed
# This ensures that the node_modules directory is as optimized as possible
RUN rm -rf node_modules \
    && yarn install --prod=true --frozen-lockfile \
    && yarn cache clean

USER node
# ... your build instructions here

###################
# PRODUCTION
###################
FROM node:18-alpine As production

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /charms/views ./views

# Might configure in docker compose
COPY env.conf ./

# Start the server using the production build
CMD [ "node", "dist/main.js" ]

