/* eslint-disable max-classes-per-file */

import { ReplaceSource } from "webpack-sources";
import * as docGen from "react-docgen-typescript";
import ts from "typescript";

// eslint-disable-next-line
// @ts-ignore: What's the right way to refer to this one?
import ModuleDependency from "webpack/lib/dependencies/ModuleDependency.js";

// eslint-disable-next-line
// @ts-ignore: What's the right way to refer to this one?
import makeSerializable from "webpack/lib/util/makeSerializable.js";

// eslint-disable-next-line
// @ts-ignore TODO: Figure out where to find a typed version
import Dependency from "webpack/lib/Dependency.js";

import { generateDocgenCodeBlock } from "./generateDocgenCodeBlock";
import { LoaderOptions } from "./types";

class DocGenDependency extends ModuleDependency {
  public static Template: ModuleDependency.Template;

  /**
   * @param {string} request request
   */
  /* constructor(request: string) {
    super(request);
  } */

  updateHash(): void {
    // TODO: See ConstDependency for reference
  }

  getReferencedExports(): [] {
    return Dependency.NO_EXPORTS_REFERENCED;
  }

  get type(): string {
    return "docgen";
  }

  get category(): string {
    return "docs";
  }

  // TODO: updateHash, serialize, deserialize
}

makeSerializable(DocGenDependency, "src/dependency");

type Options = {
  parser: docGen.FileParser;
  compilerOptions: ts.CompilerOptions;
  docgenOptions: LoaderOptions;
};

class DocGenTemplate extends ModuleDependency.Template {
  private options: Options;

  constructor(options: Options) {
    super();

    this.options = options;
  }

  apply(dependency: Dependency, source: ReplaceSource): void {
    console.log("APPLYING template");

    const { userRequest } = dependency;

    console.log("user request", userRequest);

    const tsProgram = ts.createProgram(
      [userRequest],
      this.options.compilerOptions
    );
    const componentDocs = this.options.parser.parseWithProgramProvider(
      userRequest,
      () => tsProgram
    );

    console.log("component docs", componentDocs);

    if (!componentDocs.length) {
      return;
    }

    console.log("GENERATING docgen codeblock");

    // TODO: Instead of substring, should this replace instead?
    const docgenBlock = generateDocgenCodeBlock({
      filename: userRequest,
      source: userRequest,
      componentDocs,
      docgenCollectionName:
        this.options.docgenOptions.docgenCollectionName ||
        "STORYBOOK_REACT_CLASSES",
      setDisplayName: this.options.docgenOptions.setDisplayName || true,
      typePropName: this.options.docgenOptions.typePropName || "type",
    }).substring(userRequest.length);

    console.log("DOCGEN block", docgenBlock);

    source.insert(userRequest.length, docgenBlock);
  }
}

DocGenDependency.Template = DocGenTemplate;

export default DocGenDependency;
