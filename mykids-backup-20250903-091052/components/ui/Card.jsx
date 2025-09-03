import clsx from 'clsx';

const Card = ({ 
  children, 
  hover = false, 
  className, 
  style,
  ...props 
}) => {
  const classes = clsx(
    'card',
    {
      'card-hover': hover
    },
    className
  );

  return (
    <div className={classes} style={style} {...props}>
      {children}
    </div>
  );
};

export default Card;
