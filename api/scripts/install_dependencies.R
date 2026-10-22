cran_packages <- c("arrow", "cli", "dplyr", "here", "jsonlite", "purrr", "tibble", "tidyr", "remotes")
github_packages <- c(variantstring = "1.8.7", STAVE = "2.0.4")

user_library <- Sys.getenv("R_LIBS_USER")
dir.create(user_library, recursive = TRUE, showWarnings = FALSE)
.libPaths(c(user_library, .libPaths()))

missing <- setdiff(cran_packages, rownames(installed.packages()))
if (length(missing) > 0) {
  install.packages(missing, repos = "https://cloud.r-project.org")
}

has_version <- function(package, version) {
  package %in% rownames(installed.packages()) && as.character(packageVersion(package)) == version
}

for (package in names(github_packages)) {
  version <- github_packages[[package]]
  if (!has_version(package, version)) {
    remotes::install_github(paste0("mrc-ide/", package, "@v", version), upgrade = "never")
  }
}

for (package in c(cran_packages, names(github_packages))) {
  loadNamespace(package)
}

for (package in names(github_packages)) {
  if (!has_version(package, github_packages[[package]])) {
    stop(package, " ", packageVersion(package), " is installed, but ", github_packages[[package]], " is needed")
  }
}

message("R dependencies ready: STAVE ", packageVersion("STAVE"), ", variantstring ", packageVersion("variantstring"))
