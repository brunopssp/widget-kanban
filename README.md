## Kanban Metric Widget
Get the Lead Time and the Throughput of a set of Work Items in a specific query and show as a tile on TFS dashboard.

###Environment configuration
>####Node
  https://nodejs.org
####Babel
	npm install --save-dev babel-cli
	npm install --save-dev babel-preset-es2015

###Package, Publish and Share
> Ref: https://www.visualstudio.com/en-us/docs/integrate/extensions/develop/add-dashboard-widget#step-6--package-publish-and-share
####Update the manifest file
	vss-extension.json
####Package the extension
	npm i -g tfx-cli
	cd <folder of the extension where the vss-extension.json exists>
	tfx extension create
####Upload and Install
https://www.visualstudio.com/en-us/docs/marketplace/get-tfs-extensions#upload-to-team-foundation-server
	