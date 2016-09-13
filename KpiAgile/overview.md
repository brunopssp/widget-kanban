# Kanban Metric Widget
Get the Lead Time and the Throughput of a set of Work Items in a specific query and show as a tile on TFS dashboard.

##Objetivo
>Esse widget verifica o Throughput (Itens Entregues) ou Lead Time (Tempo para conclusão) dos work items retornados em uma determinada consulta.

##Configuração do Ambiente
>####Node
  https://nodejs.org
####Babel
	npm install --save-dev babel-cli
	npm install --save-dev babel-preset-es2015
	//npm install --save-dev babel-polyfill

##Empacote, Publique e Compartilhe
> Ref: https://www.visualstudio.com/en-us/docs/integrate/extensions/develop/add-dashboard-widget#step-6--package-publish-and-share
####Atualizar o arquivo manifest
	vss-extension.json
####Empacotar a extensão
	npm i -g tfx-cli.
	cd <pasta da extensão onde o vss-extension.json está>. 
	tfx extension create
####Upload e Install no TFS
https://www.visualstudio.com/en-us/docs/marketplace/get-tfs-extensions#upload-to-team-foundation-server
	