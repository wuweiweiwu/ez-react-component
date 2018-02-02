# ez-react-component

an opinionated CLI to bootstrap your React component development.

Inspired by [fritz-c](https://github.com/fritz-c)'s setup for his projects. A lot of code was taken from [create-react-app](https://github.com/facebook/create-react-app)

## Usage

```bash
npm i -g ez-react-component

# create the environment in my-component
ez-react-component my-component
```

## Options

```bash
--use-npm # pretty self explanatory
--verbose # print everything
--info # additional debug info
```

## Scripts

```bash
# run the demo app server on localhost:3001
yarn start

# run the react storybook server on localhost:3001
yarn storybook

# build the component
yarn build

# build the demo website
yarn build:demo

# build the storybook
yarn build-storybook

# run the storybook tests using enzyme and jest
yarn test

# see above but watching for changes
yarn test:watch

# clean the dist directory
yarn clean

# clean the public directory
yarn clean:demo

# lint the project
yarn lint

# run prettier to make your code pretty
yarn prettier

# deploy the demo site to gh pages
yarn deploy
```
