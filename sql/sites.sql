SELECT DISTINCT siteloc.sitename, entity.sigle, siteloc.latdd, siteloc.londd
  FROM entity, siteloc
  WHERE
    siteloc.londd > $1 AND
    siteloc.latdd > $2 AND
    siteloc.londd < $3 AND
    siteloc.latdd < $4 AND
    entity.site_ = siteloc.site_
  ORDER BY siteloc.sitename, entity.sigle
