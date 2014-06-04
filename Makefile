VERSION=$(shell git tag | sort -t . -k 1,2n -k 2,2n -k 3,3n | tail -n 1)
FILENAME=$(shell echo $< | sed "s/\([^.]\)\.js/\1-${VERSION}.js/")

all: make-versionned-release

make-versionned-release: algoliasearch-node.js
	@echo "Generate ${VERSION} release"
	@git stash > /dev/null
	@git checkout ${VERSION} > /dev/null
	@echo "// ${FILENAME}" > ${FILENAME}
	@cat $< >> ${FILENAME}
	@git checkout master > /dev/null
	@git stash pop > /dev/null
