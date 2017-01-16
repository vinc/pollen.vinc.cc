SELECT DISTINCT siteloc.sitename, entity.sigle, siteloc.latdd, siteloc.londd
  FROM entity, siteloc
  WHERE
    entity.site_ = siteloc.site_
  ORDER BY siteloc.sitename, entity.sigle
